// src/app/pages/report-list/report-list.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { Auth } from '../../services/auth';
import { Report } from '../../services/report';

interface ReportModel {
  id_reporte: number;
  titulo: string;
  descripcion: string;
  fecha_reporte: string;
  prioridad: string;
  direccion?: string;
  anonimo?: boolean;
  latitud?: number | null;
  longitud?: number | null;
  id_usuario?: number;

  categoria?: {
    nombre_categoria: string;
  };

  municipio?: {
    nombre: string;
  };

  estados_reporte?: {
    nombre_estado: string;
  };

  usuario?: {
    id_usuario?: number;
    nombre: string;
    apellido: string;
  };

  evidencias?: {
    archivo_url: string;
    tipo_archivo: string;
  }[];
}

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-list.html',
  styleUrls: ['./report-list.css']
})
export class ReportList implements OnInit {
  
  // ── Datos del usuario ──────────────────────────
  usuario = 'Usuario';

  // ── Reportes ───────────────────────────────────
  reports: ReportModel[] = [];
  loading = true;
  error = '';

  constructor(
    private reportService: Report,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    this.loadReports();
  }

  // ═══════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════

  /**
   * Carga los datos del usuario desde la sesión.
   */
  cargarUsuario(): void {
    const session = localStorage.getItem('session');

    if (session) {
      try {
        const data = JSON.parse(session);

        if (data?.usuario) {
          this.usuario =
            data.usuario.nombre ||
            data.usuario.correo ||
            'Usuario';
        }
      } catch (error) {
        console.error('Error leyendo la sesión:', error);
      }
    }
  }

  /**
   * Cargar reportes.
   *
   * Si el usuario es CIUDADANO:
   * - Solo verá los reportes cuyo id_usuario coincida con el suyo.
   *
   * Si es ADMIN o FUNCIONARIO:
   * - Verá todos los reportes.
   */
  loadReports(): void {
    this.loading = true;
    this.error = '';

    // ── PASO 1: Intentar cargar desde cache ──
    const cache = localStorage.getItem('report_list_cache');
    if (cache) {
      try {
        const cachedReports = JSON.parse(cache);
        if (Array.isArray(cachedReports)) {
          this.reports = cachedReports;
          this.loading = false;
          this.cdr.detectChanges();
        }
      } catch (e) {
        console.warn('Cache de reportes corrupto, se ignorará');
      }
    }

    // ── PASO 2: Cargar desde API ──
    this.reportService.getAll().subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);

        let reports: ReportModel[] = [];

        // Soporta distintos formatos de respuesta
        if (response?.reports && Array.isArray(response.reports)) {
          reports = response.reports;
        } else if (response?.data && Array.isArray(response.data)) {
          reports = response.data;
        } else if (Array.isArray(response)) {
          reports = response;
        }

        const role = this.getUserRole();
        const currentUser = this.auth.getUser();

        console.log('Rol actual:', role);
        console.log('Usuario actual:', currentUser);

        // Filtrar SOLO para ciudadanos
        if (role === 'CIUDADANO') {
          const currentUserId = Number(currentUser?.id_usuario);

          reports = reports.filter((report: ReportModel) => {
            const reportUserId = Number(
              report.usuario?.id_usuario ??
              report.id_usuario ??
              0
            );

            console.log(
              `Reporte ${report.id_reporte}: usuario=${reportUserId}, actual=${currentUserId}`
            );

            return reportUserId === currentUserId;
          });

          console.log('Reportes del ciudadano:', reports);
        }

        // Actualizar cache
        localStorage.setItem('report_list_cache', JSON.stringify(reports));

        // Aplicar a la vista
        this.reports = reports;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando reportes:', err);

        // Si no hay datos en cache, mostrar error
        if (this.reports.length === 0) {
          this.error = 'No se pudieron cargar los reportes. Intenta de nuevo más tarde.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════
  // ROLES Y PERMISOS
  // ═══════════════════════════════════════════════

  /**
   * Obtener rol del usuario.
   */
  private getUserRole(): string {
    const user = this.auth.getUser();

    const rawRole =
      user?.rol ||
      user?.role ||
      user?.nombre_rol ||
      user?.rol_nombre ||
      user?.rol?.nombre_rol ||
      user?.rol?.nombre ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      '';

    return rawRole
      .toString()
      .trim()
      .toUpperCase();
  }

  /**
   * Verifica si el usuario es administrador.
   */
  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'ADMIN' || role === 'ADMINISTRADOR';
  }

  /**
   * Puede eliminar:
   * - ADMIN
   * - ADMINISTRADOR
   */
  canDelete(): boolean {
    return this.isAdmin();
  }

  // ═══════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════

  /**
   * Eliminar reporte.
   */
  deleteReport(id: number): void {
    const confirmar = confirm(
      '¿Deseas eliminar este reporte? Esta acción no se puede deshacer.'
    );

    if (!confirmar) {
      return;
    }

    this.reportService.delete(id).subscribe({
      next: () => {
        // Eliminar de la lista local
        this.reports = this.reports.filter(
          report => report.id_reporte !== id
        );

        // Actualizar cache
        localStorage.setItem('report_list_cache', JSON.stringify(this.reports));

        // Limpiar cache del dashboard para que se refresque
        localStorage.removeItem('dashboard_cache');

        alert('Reporte eliminado correctamente.');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error eliminando reporte:', err);
        alert('No fue posible eliminar el reporte. Intenta de nuevo.');
      }
    });
  }

  /**
   * Cerrar sesión.
   */
  logout(): void {
    // Limpiar todos los caches
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('report_list_cache');
    
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ═══════════════════════════════════════════════
  // HELPERS DE UI (CLASES CSS DINÁMICAS)
  // ═══════════════════════════════════════════════

  /**
   * Clase del badge de estado para reportes.
   * Usada con [ngClass]="getEstadoClass(report.estados_reporte?.nombre_estado)"
   */
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