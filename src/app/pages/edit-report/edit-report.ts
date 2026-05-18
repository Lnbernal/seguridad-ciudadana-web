// src/app/pages/edit-report/edit-report.ts

import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import * as L from 'leaflet';

import { Report } from '../../services/report';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-edit-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-report.html',
  styleUrls: ['./edit-report.css']
})
export class EditReport implements OnInit, AfterViewInit {

  // ── Datos ──────────────────────────────────────
  reportId: number | null = null;
  loading = true;
  error = '';
  success = '';
  saving = false;

  form = {
    titulo: '',
    descripcion: '',
    fecha_reporte: '',
    prioridad: 'BAJA',
    direccion: '',
    latitud: null as number | null,
    longitud: null as number | null,
    anonimo: false
  };

  // Mapa
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  constructor(
    private route: ActivatedRoute,
    private reportService: Report,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.error = 'ID de reporte inválido.';
      this.loading = false;
      return;
    }

    this.reportId = id;
    this.loadReport(id);
  }

  ngAfterViewInit(): void {
    // El mapa se inicializa después de cargar los datos
  }

  // ═══════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════

  loadReport(id: number): void {
    this.loading = true;
    this.error = '';

    this.reportService.getById(id).subscribe({
      next: (data: any) => {
        const report = data?.report || data;

        if (!report) {
          this.error = 'Reporte no encontrado.';
          this.loading = false;
          return;
        }

        // Llenar formulario
        this.form.titulo = report.titulo || '';
        this.form.descripcion = report.descripcion || '';
        this.form.prioridad = report.prioridad || 'BAJA';
        this.form.direccion = report.direccion || '';
        this.form.latitud = report.latitud || null;
        this.form.longitud = report.longitud || null;
        this.form.anonimo = report.anonimo || false;

        // Formatear fecha para el input date (YYYY-MM-DD)
        if (report.fecha_reporte) {
          const fecha = new Date(report.fecha_reporte);
          this.form.fecha_reporte = fecha.toISOString().split('T')[0];
        }

        this.loading = false;
        this.cdr.detectChanges();

        // Inicializar mapa
        setTimeout(() => this.initMap(), 200);
      },
      error: (err: any) => {
        console.error('Error cargando reporte:', err);
        this.error = 'No se pudo cargar el reporte.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════
  // MAPA
  // ═══════════════════════════════════════════════

  initMap(): void {
    const container = document.getElementById('edit-map');
    if (!container) return;

    // Coordenadas iniciales
    const lat = this.form.latitud || 4.5709;
    const lng = this.form.longitud || -74.2973;

    if (this.map) this.map.remove();

    this.map = L.map('edit-map', {
      center: [lat, lng],
      zoom: this.form.latitud ? 16 : 6,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    // Marcador
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    // Actualizar coordenadas al hacer clic en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLng } = e.latlng;

      this.form.latitud = parseFloat(newLat.toFixed(6));
      this.form.longitud = parseFloat(newLng.toFixed(6));

      if (this.marker) {
        this.marker.setLatLng([newLat, newLng]);
      }

      this.cdr.detectChanges();
    });

    // Actualizar coordenadas al arrastrar el marcador
    this.marker.on('dragend', () => {
      const pos = this.marker!.getLatLng();

      this.form.latitud = parseFloat(pos.lat.toFixed(6));
      this.form.longitud = parseFloat(pos.lng.toFixed(6));

      this.cdr.detectChanges();
    });

    setTimeout(() => this.map!.invalidateSize(), 300);
  }

  // ═══════════════════════════════════════════════
  // GUARDAR
  // ═══════════════════════════════════════════════

  guardar(): void {
    if (!this.reportId) return;
    if (!this.form.titulo.trim() || !this.form.descripcion.trim()) {
      alert('El título y la descripción son obligatorios.');
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const payload = {
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim(),
      prioridad: this.form.prioridad,
      direccion: this.form.direccion || null,
      latitud: this.form.latitud,
      longitud: this.form.longitud,
      anonimo: this.form.anonimo,
      fecha_reporte: this.form.fecha_reporte || undefined
    };

    this.reportService.update(this.reportId, payload).subscribe({
      next: (response: any) => {
        console.log('Reporte actualizado:', response);

        // Limpiar caches
        localStorage.removeItem('dashboard_cache');
        localStorage.removeItem('report_list_cache');

        this.success = 'Reporte actualizado correctamente. Redirigiendo...';
        this.saving = false;
        this.cdr.detectChanges();

        // Redirigir después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/reportes', this.reportId]);
        }, 1500);
      },
      error: (err: any) => {
        console.error('Error actualizando reporte:', err);
        this.error = err?.error?.message || 'No se pudo actualizar el reporte.';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════
  // ROLES Y SESIÓN
  // ═══════════════════════════════════════════════

  private getUserRole(): string {
    const user = this.auth.getUser();
    return (
      user?.rol ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      ''
    ).toString().trim().toUpperCase();
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'ADMIN' || role === 'ADMINISTRADOR';
  }

  logout(): void {
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('report_list_cache');
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}