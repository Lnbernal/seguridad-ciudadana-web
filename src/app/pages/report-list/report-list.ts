// src/app/pages/report-list/report-list.ts

import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  templateUrl: './report-list.html'
})
export class ReportList implements OnInit {
  reports: ReportModel[] = [];
  loading = true;
  error = '';

  constructor(
    private reportService: Report,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    console.log('Cargando reportes...');

    this.loading = true;
    this.error = '';

    this.reportService.getAll().subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);

        // Si el backend devuelve { reports: [...] }
        if (response?.reports) {
          this.reports = response.reports;
        }
        // Si devuelve directamente un array
        else if (Array.isArray(response)) {
          this.reports = response;
        }
        // Si no viene nada válido
        else {
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

  deleteReport(id: number): void {
    const confirmar = confirm(
      '¿Está seguro de eliminar este reporte?'
    );

    if (!confirmar) {
      return;
    }

    this.reportService.delete(id).subscribe({
      next: () => {
        alert('Reporte eliminado correctamente');
        this.loadReports();
      },
      error: (err: any) => {
        console.error('Error eliminando reporte:', err);
        alert('No se pudo eliminar el reporte');
      }
    });
  }
}