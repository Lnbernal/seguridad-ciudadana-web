// src/app/pages/report-detail/report-detail.ts

import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';

import * as L from 'leaflet';

import { Report } from '../../services/report';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe
  ],
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
    // El mapa se inicializa después de cargar el reporte.
  }

  loadReport(id: number): void {
    this.loading = true;
    this.error = '';

    this.reportService.getById(id).subscribe({
      next: (data: any) => {
        this.report = data?.report || data;
        this.loading = false;

        this.cdr.detectChanges();

        // Inicializar mapa si hay coordenadas
        if (
          this.report?.latitud != null &&
          this.report?.longitud != null
        ) {
          setTimeout(() => {
            this.initMap();
          }, 200);
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

  /**
   * Inicializa el mapa con Leaflet.
   */
  initMap(): void {
    if (!this.report) {
      return;
    }

    const lat = Number(this.report.latitud);
    const lng = Number(this.report.longitud);

    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    // Si ya existe, destruirlo antes de recrearlo
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('detail-map', {
      center: [lat, lng],
      zoom: 16
    });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    this.marker = L.marker([lat, lng]).addTo(this.map);

    // Ajustar tamaño del mapa
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);

    this.mapInitialized = true;
  }

  // ==========================
  // CONTROL DE ROLES
  // ==========================
  private getUserRole(): string {
    const user = this.auth.getUser();

    return (
      user?.rol ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();
  }

  canEdit(): boolean {
    const rol = this.getUserRole();

    return (
      rol === 'ADMIN' ||
      rol === 'ADMINISTRADOR' ||
      rol === 'FUNCIONARIO'
    );
  }

  canDelete(): boolean {
    const rol = this.getUserRole();

    return (
      rol === 'ADMIN' ||
      rol === 'ADMINISTRADOR'
    );
  }

  // ==========================
  // ELIMINAR REPORTE
  // ==========================
  deleteReport(): void {
    if (!this.report?.id_reporte) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar el reporte "${this.report.titulo}"?`
    );

    if (!confirmar) {
      return;
    }

    this.reportService.delete(this.report.id_reporte).subscribe({
      next: () => {
        alert('Reporte eliminado correctamente.');
        this.router.navigate(['/reportes']);
      },
      error: (err: any) => {
        console.error('Error eliminando reporte:', err);
        alert('No se pudo eliminar el reporte.');
      }
    });
  }

  // ==========================
  // CERRAR SESIÓN
  // ==========================
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}