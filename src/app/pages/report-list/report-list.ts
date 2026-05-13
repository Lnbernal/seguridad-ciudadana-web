// src/app/pages/report-list/report-list.ts

import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

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
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './report-list.html',
  styleUrls: ['./report-list.css']
})
export class ReportList implements OnInit {
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
    this.loadReports();
  }

  /**
   * Cargar reportes.
   *
   * Si el usuario es CIUDADANO:
   * - Solo verá los reportes cuyo id_usuario coincida
   *   con su id_usuario.
   *
   * Si es ADMIN o FUNCIONARIO:
   * - Verá todos los reportes.
   */
  loadReports(): void {
    this.loading = true;
    this.error = '';

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

        this.reports = reports;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando reportes:', err);

        this.error = 'No se pudieron cargar los reportes.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

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
   * Puede editar:
   * - ADMIN
   * - ADMINISTRADOR
   * - FUNCIONARIO
   */
  canEdit(): boolean {
    const role = this.getUserRole();

    return [
      'ADMIN',
      'ADMINISTRADOR',
      'FUNCIONARIO'
    ].includes(role);
  }

  /**
   * Puede eliminar:
   * - ADMIN
   * - ADMINISTRADOR
   */
  canDelete(): boolean {
    const role = this.getUserRole();

    return role.includes('ADMIN');
  }

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
        this.reports = this.reports.filter(
          report => report.id_reporte !== id
        );

        alert('Reporte eliminado correctamente.');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error eliminando reporte:', err);
        alert('No fue posible eliminar el reporte.');
      }
    });
  }

  /**
   * Cerrar sesión.
   */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}