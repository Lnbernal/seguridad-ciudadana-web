// src/app/pages/report-detail/report-detail.ts

import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';

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
export class ReportDetail implements OnInit {
  report: any = null;
  loading = true;
  error = '';

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

  loadReport(id: number): void {
    this.loading = true;
    this.error = '';

    this.reportService.getById(id).subscribe({
      next: (data: any) => {
        this.report = data?.report || data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando reporte:', err);
        this.error = 'No se pudo cargar el reporte.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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
    return rol === 'ADMIN' || rol === 'FUNCIONARIO';
  }

  canDelete(): boolean {
    const rol = this.getUserRole();
    return rol === 'ADMIN';
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