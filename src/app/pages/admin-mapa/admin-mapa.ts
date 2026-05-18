// src/app/pages/admin-mapa/admin-mapa.ts

import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Auth } from '../../services/auth';
import { Report } from '../../services/report';

// Leaflet
import * as L from 'leaflet';

@Component({
  selector: 'app-admin-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-mapa.html',
  styleUrls: ['./admin-mapa.css']
})
export class AdminMapa implements OnInit, AfterViewInit {

  // ── Datos ──────────────────────────────────────
  usuario = 'Usuario';
  loading = true;
  error = '';

  // Mapa
  private mapa: L.Map | undefined;
  private marcadores: L.Marker[] = [];

  // Datos
  todosLosIncidentes: any[] = [];
  incidentesFiltrados: any[] = [];
  categorias: any[] = [];

  // Filtros
  filtroCategoria: number | string = '';
  filtroPrioridad = '';
  filtroEstado = '';

  constructor(
    private reportService: Report,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();

    if (!this.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
  }

  // ═══════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════

  cargarUsuario(): void {
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data?.usuario) {
          this.usuario = data.usuario.nombre || data.usuario.correo || 'Usuario';
        }
      } catch (e) {
        console.error('Error leyendo sesión:', e);
      }
    }
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';

    this.reportService.getAll().subscribe({
      next: (response: any) => {
        console.log('Reportes recibidos:', response);

        let reportes: any[] = [];

        if (response?.reports && Array.isArray(response.reports)) {
          reportes = response.reports;
        } else if (Array.isArray(response)) {
          reportes = response;
        }

        // Filtrar solo los que tienen coordenadas
        this.todosLosIncidentes = reportes.filter(
          (r: any) => r.latitud && r.longitud
        );

        // Extraer categorías únicas
        const catsMap = new Map<number, any>();
        this.todosLosIncidentes.forEach(r => {
          if (r.categoria && !catsMap.has(r.categoria.id_categoria)) {
            catsMap.set(r.categoria.id_categoria, r.categoria);
          }
        });
        this.categorias = Array.from(catsMap.values());

        this.aplicarFiltros();
        this.loading = false;
        this.cdr.detectChanges();

        // Inicializar mapa después de cargar datos
        setTimeout(() => this.inicializarMapa(), 100);
      },
      error: (err: any) => {
        console.error('Error cargando reportes:', err);
        this.error = 'No se pudieron cargar los incidentes.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════
  // MAPA
  // ═══════════════════════════════════════════════

  inicializarMapa(): void {
    const container = document.getElementById('mapaIncidentes');
    if (!container || this.mapa) return;

    // Coordenadas centrales (Colombia)
    const latitudCentro = 4.5709;
    const longitudCentro = -74.2973;

    this.mapa = L.map('mapaIncidentes', {
      center: [latitudCentro, longitudCentro],
      zoom: 6,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.mapa);

    setTimeout(() => {
      this.mapa?.invalidateSize();
    }, 200);

    this.actualizarMarcadores();
  }

  actualizarMarcadores(): void {
    if (!this.mapa) return;

    // Limpiar marcadores existentes
    this.marcadores.forEach(m => this.mapa!.removeLayer(m));
    this.marcadores = [];

    // Crear marcadores para los incidentes filtrados
    const bounds = L.latLngBounds([]);

    this.incidentesFiltrados.forEach(incidente => {
      const marker = L.marker([incidente.latitud, incidente.longitud], {
        icon: this.crearIconoPrioridad(incidente.prioridad)
      });

      const popupContent = `
        <div style="min-width:180px;">
          <strong>${incidente.titulo}</strong>
          <p style="margin:4px 0; font-size:0.78rem; color:#94a3b8;">
            ${incidente.categoria?.nombre_categoria || 'Sin categoría'}
          </p>
          <span style="
            display:inline-block;
            padding:2px 8px;
            border-radius:10px;
            font-size:0.68rem;
            font-weight:600;
            background:${this.getColorPrioridad(incidente.prioridad)}20;
            color:${this.getColorPrioridad(incidente.prioridad)};
            border:1px solid ${this.getColorPrioridad(incidente.prioridad)}40;
          ">
            ${incidente.prioridad}
          </span>
          <p style="margin:6px 0 0; font-size:0.72rem; color:#64748b;">
            ${incidente.estados_reporte?.nombre_estado || 'Pendiente'}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(this.mapa!);

      this.marcadores.push(marker);
      bounds.extend([incidente.latitud, incidente.longitud]);
    });

    // Ajustar vista a los marcadores
    if (this.marcadores.length > 0) {
      this.mapa.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  crearIconoPrioridad(prioridad: string): L.DivIcon {
    const color = this.getColorPrioridad(prioridad);

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 12px ${color}80;
          animation: pulse 2s ease-in-out infinite;
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -10]
    });
  }

  getColorPrioridad(prioridad: string): string {
    switch (prioridad?.toUpperCase()) {
      case 'ALTA':  return '#f87171';
      case 'MEDIA': return '#fbbf24';
      case 'BAJA':  return '#94a3b8';
      default:      return '#64748b';
    }
  }

  // ═══════════════════════════════════════════════
  // FILTROS
  // ═══════════════════════════════════════════════

  aplicarFiltros(): void {
    this.incidentesFiltrados = this.todosLosIncidentes.filter(r => {
      // Categoría
      if (this.filtroCategoria && r.categoria?.id_categoria !== Number(this.filtroCategoria)) {
        return false;
      }

      // Prioridad
      if (this.filtroPrioridad && r.prioridad?.toUpperCase() !== this.filtroPrioridad.toUpperCase()) {
        return false;
      }

      // Estado
      if (this.filtroEstado) {
        const estado = (r.estados_reporte?.nombre_estado || '').toLowerCase();
        if (!estado.includes(this.filtroEstado.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    this.actualizarMarcadores();
  }

  setPrioridad(prioridad: string): void {
    this.filtroPrioridad = this.filtroPrioridad === prioridad ? '' : prioridad;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroCategoria = '';
    this.filtroPrioridad = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  // ═══════════════════════════════════════════════
  // VALIDACIONES
  // ═══════════════════════════════════════════════

  isAdmin(): boolean {
    const user = this.auth.getUser();

    if (Number(user?.id_rol) === 1) return true;

    const role =
      user?.rol ||
      user?.role ||
      user?.nombre_rol ||
      user?.rol?.nombre_rol ||
      user?.rol?.nombre ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      '';

    return role.toString().trim().toUpperCase() === 'ADMIN';
  }

  // ═══════════════════════════════════════════════
  // SESIÓN
  // ═══════════════════════════════════════════════

  logout(): void {
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('report_list_cache');
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}