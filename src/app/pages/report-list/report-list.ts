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
    console.log('Usuario autenticado:', this.auth.getUser());
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.error = '';

    this.reportService.getAll().subscribe({
      next: (response: any) => {
        if (response?.reports) {
          this.reports = response.reports;
        } else if (Array.isArray(response)) {
          this.reports = response;
        } else {
          this.reports = [];
        }

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
   * Obtiene el rol del usuario sin importar
   * cómo venga estructurado en el objeto.
   */
  private getUserRole(): string {
    const user = this.auth.getUser();

    console.log('Usuario autenticado:', user);

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

    const role = rawRole
      .toString()
      .trim()
      .toUpperCase();

    console.log('Rol normalizado:', role);

    return role;
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
  // En report-list.ts, reemplaza SOLO este método.

  canDelete(): boolean {
    const role = this.getUserRole();

    console.log('Rol para eliminar:', role);

    // Si el rol viene como objeto o como texto diferente,
    // esta validación permite ADMIN en cualquier formato.
    return role.includes('ADMIN');
  }

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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}