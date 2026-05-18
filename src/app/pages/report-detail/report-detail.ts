// src/app/pages/report-detail/report-detail.ts

import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import * as L from 'leaflet';

import { Report } from '../../services/report';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './report-detail.html',
  styleUrls: ['./report-detail.css']
})
export class ReportDetail implements OnInit, AfterViewInit {
  
  report: any = null;
  loading = true;
  error = '';

  map!: L.Map;
  marker!: L.Marker;
  mapInitialized = false;

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

    this.loadReport(id);
  }

  ngAfterViewInit(): void {
    // El mapa se inicializa después de cargar el reporte
  }

  // ═══════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════

  loadReport(id: number): void {
    this.loading = true;
    this.error = '';

    this.reportService.getById(id).subscribe({
      next: (data: any) => {
        this.report = data?.report || data;
        this.loading = false;
        this.cdr.detectChanges();

        if (this.report?.latitud != null && this.report?.longitud != null) {
          setTimeout(() => this.initMap(), 200);
        }
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
    if (!this.report) return;

    const lat = Number(this.report.latitud);
    const lng = Number(this.report.longitud);

    if (isNaN(lat) || isNaN(lng)) return;

    if (this.map) this.map.remove();

    this.map = L.map('detail-map', {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    this.marker = L.marker([lat, lng]).addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 300);
    this.mapInitialized = true;
  }

  // ═══════════════════════════════════════════════
  // ROLES Y PERMISOS
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

  canEdit(): boolean {
    const role = this.getUserRole();
    return role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'FUNCIONARIO';
  }

  canDelete(): boolean {
    return this.isAdmin();
  }

  // ═══════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════

  deleteReport(): void {
    if (!this.report?.id_reporte) return;

    const confirmar = confirm(`¿Está seguro de eliminar el reporte "${this.report.titulo}"?`);
    if (!confirmar) return;

    this.reportService.delete(this.report.id_reporte).subscribe({
      next: () => {
        localStorage.removeItem('dashboard_cache');
        localStorage.removeItem('report_list_cache');
        alert('Reporte eliminado correctamente.');
        this.router.navigate(['/reportes']);
      },
      error: (err: any) => {
        console.error('Error eliminando reporte:', err);
        alert('No se pudo eliminar el reporte.');
      }
    });
  }

  logout(): void {
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('report_list_cache');
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ═══════════════════════════════════════════════
  // HELPERS DE UI
  // ═══════════════════════════════════════════════

  getEstadoClass(estado: string | undefined): string {
    if (!estado) return 'estado-default';
    const e = estado.toLowerCase().trim();
    if (e.includes('proceso'))     return 'estado-proceso';
    if (e.includes('resuelto'))    return 'estado-resuelto';
    if (e.includes('visualizado')) return 'estado-visualizado';
    if (e.includes('pendiente'))   return 'estado-pendiente';
    return 'estado-default';
  }
}