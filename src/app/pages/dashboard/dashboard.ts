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

  // ── Datos del usuario ──────────────────────────
  usuario = 'Usuario';
  usuarioIniciales = 'U';
  rolUsuario = 'Ciudadano';

  // ── Estadísticas ───────────────────────────────
  totalReportes = 0;
  enProceso     = 0;
  visualizados  = 0;
  resueltos     = 0;
  pendientes    = 0;

  // ── Último reporte ─────────────────────────────
  ultimoReporte: any = null;

  // ── Seguimiento ────────────────────────────────
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

  // ── Carga de datos ─────────────────────────────

  cargarUsuario(): void {
    const session = localStorage.getItem('session');

    if (session) {
      try {
        const data = JSON.parse(session);

        if (data?.usuario) {
          const nombre =
            data.usuario.nombre ||
            data.usuario.correo ||
            'Usuario';

          this.usuario         = nombre;
          this.usuarioIniciales = this.getIniciales(nombre);
        }
      } catch (error) {
        console.error('Error leyendo la sesión:', error);
      }
    }

    this.rolUsuario = this.isAdmin() ? 'Administrador' : 'Ciudadano';
  }

  cargarDashboard(): void {
    this.reportService.getAll().subscribe({
      next: (response: any) => {
        const reportes = response?.reports || response || [];

        if (!Array.isArray(reportes)) return;

        // Estadísticas
        this.totalReportes = reportes.length;

        this.enProceso = reportes.filter((r: any) =>
          this.obtenerEstado(r).toLowerCase().includes('proceso')
        ).length;

        this.visualizados = reportes.filter((r: any) =>
          this.obtenerEstado(r).toLowerCase().includes('visualizado')
        ).length;

        this.resueltos = reportes.filter((r: any) =>
          this.obtenerEstado(r).toLowerCase().includes('resuelto')
        ).length;

        // Pendientes = reportes sin estado avanzado (para el badge del sidebar)
        this.pendientes = reportes.filter((r: any) =>
          this.obtenerEstado(r).toLowerCase().includes('pendiente')
        ).length;

        // Último reporte ordenado por id
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

  // ── Lógica de negocio ──────────────────────────

  obtenerEstado(reporte: any): string {
    return (
      reporte?.estados_reporte?.nombre_estado ||
      reporte?.estado?.nombre_estado ||
      'Pendiente'
    );
  }

  generarSeguimiento(reporte: any): void {
    const estado = this.obtenerEstado(reporte);

    // Cada item tiene 'titulo', 'fecha' y 'estado' para los badges y dots
    this.seguimiento = [
      {
        titulo: 'Reporte registrado',
        fecha:  reporte.fecha_reporte,
        estado: 'Resuelto'   // el registro siempre se completó
      }
    ];

    if (['Visualizado', 'En proceso', 'Resuelto'].includes(estado)) {
      this.seguimiento.push({
        titulo: 'Reporte visualizado',
        fecha:  'Actualizado por el sistema',
        estado: 'Resuelto'
      });
    }

    if (['En proceso', 'Resuelto'].includes(estado)) {
      this.seguimiento.push({
        titulo: 'Atención en proceso',
        fecha:  'En gestión',
        estado: estado === 'Resuelto' ? 'Resuelto' : 'En proceso'
      });
    }

    if (estado === 'Resuelto') {
      this.seguimiento.push({
        titulo: 'Caso resuelto',
        fecha:  'Finalizado',
        estado: 'Resuelto'
      });
    }

    // Paso futuro si aún no está resuelto
    if (estado !== 'Resuelto') {
      this.seguimiento.push({
        titulo: 'Resolución pendiente',
        fecha:  'Por definir',
        estado: 'Pendiente'
      });
    }
  }

  // ── Helpers de roles ───────────────────────────

  isAdmin(): boolean {
    const user = this.auth.getUser();

    const role =
      user?.rol ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      '';

    return role.toString().trim().toUpperCase() === 'ADMIN';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ── Helpers de UI (clases CSS dinámicas) ───────

  /**
   * Clase del badge de estado para reportes y timeline.
   * Usada con [ngClass]="getEstadoClass(estado)"
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

  /**
   * Clase del badge de prioridad.
   * Usada con [ngClass]="getPriorityClass(ultimoReporte.prioridad)"
   */
  getPriorityClass(prioridad: string | undefined): string {
    if (!prioridad) return 'priority-baja';
    const p = prioridad.toLowerCase().trim();
    if (p === 'alta')  return 'priority-alta';
    if (p === 'media') return 'priority-media';
    return 'priority-baja';
  }

  /**
   * Clase CSS del badge de tendencia según proporción valor/total.
   * Si el valor supera el 30% del total → trend-up, si es 0 → trend-neutral.
   */
  getTendenciaClass(valor: number, total: number): string {
    if (total === 0) return 'trend-neutral';
    const ratio = valor / total;
    if (ratio >= 0.3) return 'trend-up';
    if (ratio === 0)  return 'trend-neutral';
    return 'trend-down';
  }

  /**
   * Etiqueta del badge de tendencia.
   * Muestra el valor absoluto como referencia visual.
   */
  getTendenciaLabel(valor: number): string {
    return valor > 0 ? `↑ ${valor}` : `→ 0`;
  }

  /**
   * Clase del dot de la timeline según el estado del item.
   * Usada con [ngClass]="getTimelineDotClass(item.estado)"
   */
  getTimelineDotClass(estado: string | undefined): string {
    if (!estado) return 'dot-gray';
    const e = estado.toLowerCase().trim();
    if (e.includes('resuelto'))   return 'dot-green';
    if (e.includes('proceso'))    return 'dot-blue';
    if (e.includes('pendiente'))  return 'dot-amber';
    return 'dot-gray';
  }

  // ── Utilidades privadas ────────────────────────

  /**
   * Genera iniciales desde el nombre completo.
   * "Nicolas Casas" → "NC" | "admin@correo.com" → "A"
   */
  private getIniciales(nombre: string): string {
    if (nombre.includes('@')) {
      return nombre[0].toUpperCase();
    }
    return nombre
      .split(' ')
      .filter(w => w.length > 0)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }
}