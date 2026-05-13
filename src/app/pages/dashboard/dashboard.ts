import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { Auth } from '../../services/auth';
import { Report } from '../../services/report';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  usuario = 'Usuario';

  // Estadísticas
  totalReportes = 0;
  enProceso = 0;
  visualizados = 0;
  resueltos = 0;

  // Último reporte
  ultimoReporte: any = null;

  // Timeline del último reporte
  seguimiento: any[] = [];

  constructor(
    private auth: Auth,
    private reportService: Report,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarDashboard();
  }

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

  cargarDashboard(): void {
    this.reportService.getAll().subscribe({
      next: (response: any) => {
        const reportes = response?.reports || response || [];

        if (!Array.isArray(reportes)) {
          return;
        }

        // Estadísticas
        this.totalReportes = reportes.length;

        this.enProceso = reportes.filter((r: any) =>
          this.obtenerEstado(r)
            .toLowerCase()
            .includes('proceso')
        ).length;

        this.visualizados = reportes.filter((r: any) =>
          this.obtenerEstado(r)
            .toLowerCase()
            .includes('visualizado')
        ).length;

        this.resueltos = reportes.filter((r: any) =>
          this.obtenerEstado(r)
            .toLowerCase()
            .includes('resuelto')
        ).length;

        // Último reporte (ordenado por id)
        const ordenados = [...reportes].sort(
          (a, b) => b.id_reporte - a.id_reporte
        );

        this.ultimoReporte = ordenados[0] || null;

        if (this.ultimoReporte) {
          this.generarSeguimiento(this.ultimoReporte);
        }
      },
      error: (err) => {
        console.error('Error cargando dashboard:', err);
      }
    });
  }

  obtenerEstado(reporte: any): string {
    return (
      reporte?.estados_reporte?.nombre_estado ||
      reporte?.estado?.nombre_estado ||
      'Pendiente'
    );
  }

  generarSeguimiento(reporte: any): void {
    const estado = this.obtenerEstado(reporte);

    this.seguimiento = [
      {
        titulo: 'Reporte registrado',
        fecha: reporte.fecha_reporte
      }
    ];

    if (
      ['Visualizado', 'En proceso', 'Resuelto'].includes(estado)
    ) {
      this.seguimiento.push({
        titulo: 'Reporte visualizado',
        fecha: 'Actualizado por el sistema'
      });
    }

    if (
      ['En proceso', 'Resuelto'].includes(estado)
    ) {
      this.seguimiento.push({
        titulo: 'Atención en proceso',
        fecha: 'En gestión'
      });
    }

    if (estado === 'Resuelto') {
      this.seguimiento.push({
        titulo: 'Caso resuelto',
        fecha: 'Finalizado'
      });
    }
  }
  isAdmin(): boolean {
  const user = this.auth.getUser();

  const role =
    user?.rol ||
    user?.role?.nombre_rol ||
    user?.role?.nombre ||
    '';

  return role
    .toString()
    .trim()
    .toUpperCase() === 'ADMIN';
}
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}