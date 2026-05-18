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

  // ── Loading ────────────────────────────────────
  loading = true;

  constructor(
    private auth: Auth,
    private reportService: Report,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarDashboard();
  }

  // ═══════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════

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
    // ── PASO 1: Cargar inmediatamente desde localStorage (sin esperar API) ──
    const cache = localStorage.getItem('dashboard_cache');
    if (cache) {
      try {
        const data = JSON.parse(cache);
        this.aplicarDatosDashboard(data);
        this.loading = false;
      } catch (e) {
        console.warn('Cache corrupto, se ignorará');
      }
    }

    // ── PASO 2: Llamar a la API y actualizar cache + vista ──
    this.reportService.getAll().subscribe({
      next: (response: any) => {
        const reportes = response?.reports || response || [];

        if (!Array.isArray(reportes)) {
          this.loading = false;
          return;
        }

        // Procesar datos
        const datosProcesados = this.procesarReportes(reportes);
        
        // Guardar en localStorage para la próxima recarga
        localStorage.setItem('dashboard_cache', JSON.stringify(datosProcesados));
        
        // Aplicar a la vista
        this.aplicarDatosDashboard(datosProcesados);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando dashboard:', err);
        this.loading = false;
        // Si hay error, los datos del cache ya se mostraron en el PASO 1
      }
    });
  }

  // ═══════════════════════════════════════════════
  // PROCESAMIENTO DE DATOS
  // ═══════════════════════════════════════════════

  /**
   * Procesa el array de reportes y devuelve un objeto con todas las
   * estadísticas, último reporte y timeline de seguimiento.
   */
  private procesarReportes(reportes: any[]): any {
    // Estadísticas
    const totalReportes = reportes.length;

    const enProceso = reportes.filter((r: any) =>
      this.obtenerEstado(r).toLowerCase().includes('proceso')
    ).length;

    const visualizados = reportes.filter((r: any) =>
      this.obtenerEstado(r).toLowerCase().includes('visualizado')
    ).length;

    const resueltos = reportes.filter((r: any) =>
      this.obtenerEstado(r).toLowerCase().includes('resuelto')
    ).length;

    const pendientes = reportes.filter((r: any) =>
      this.obtenerEstado(r).toLowerCase().includes('pendiente')
    ).length;

    // Último reporte ordenado por id_reporte descendente
    const ordenados = [...reportes].sort(
      (a, b) => b.id_reporte - a.id_reporte
    );
    const ultimoReporte = ordenados[0] || null;

    // Generar timeline de seguimiento
    const seguimiento = ultimoReporte 
      ? this.generarSeguimientoDesdeReporte(ultimoReporte) 
      : [];

    return {
      totalReportes,
      enProceso,
      visualizados,
      resueltos,
      pendientes,
      ultimoReporte,
      seguimiento
    };
  }

  /**
   * Aplica un objeto de datos procesados a las variables de la vista.
   */
  private aplicarDatosDashboard(data: any): void {
    this.totalReportes = data.totalReportes ?? 0;
    this.enProceso     = data.enProceso ?? 0;
    this.visualizados  = data.visualizados ?? 0;
    this.resueltos     = data.resueltos ?? 0;
    this.pendientes    = data.pendientes ?? 0;
    this.ultimoReporte = data.ultimoReporte ?? null;
    this.seguimiento   = data.seguimiento ?? [];
  }

  /**
   * Genera el array de seguimiento (timeline) a partir de un reporte.
   */
  private generarSeguimientoDesdeReporte(reporte: any): any[] {
    const estado = this.obtenerEstado(reporte);
    const seguimiento: any[] = [];

    // 1. Registro inicial (siempre aparece)
    seguimiento.push({
      titulo: 'Reporte registrado',
      fecha:  reporte.fecha_reporte,
      estado: 'Resuelto'
    });

    // 2. Visualizado
    if (['Visualizado', 'En proceso', 'Resuelto'].includes(estado)) {
      seguimiento.push({
        titulo: 'Reporte visualizado',
        fecha:  'Actualizado por el sistema',
        estado: 'Resuelto'
      });
    }

    // 3. En proceso
    if (['En proceso', 'Resuelto'].includes(estado)) {
      seguimiento.push({
        titulo: 'Atención en proceso',
        fecha:  'En gestión',
        estado: estado === 'Resuelto' ? 'Resuelto' : 'En proceso'
      });
    }

    // 4. Resuelto
    if (estado === 'Resuelto') {
      seguimiento.push({
        titulo: 'Caso resuelto',
        fecha:  'Finalizado',
        estado: 'Resuelto'
      });
    }

    // 5. Pendiente futuro (si no está resuelto aún)
    if (estado !== 'Resuelto') {
      seguimiento.push({
        titulo: 'Resolución pendiente',
        fecha:  'Por definir',
        estado: 'Pendiente'
      });
    }

    return seguimiento;
  }

  // ═══════════════════════════════════════════════
  // LÓGICA DE NEGOCIO
  // ═══════════════════════════════════════════════

  /**
   * Obtiene el nombre del estado de un reporte, desde cualquiera
   * de las estructuras posibles que vengan del backend.
   */
  obtenerEstado(reporte: any): string {
    return (
      reporte?.estados_reporte?.nombre_estado ||
      reporte?.estado?.nombre_estado ||
      'Pendiente'
    );
  }

  // ═══════════════════════════════════════════════
  // ROLES Y SESIÓN
  // ═══════════════════════════════════════════════

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
    localStorage.removeItem('dashboard_cache'); // Limpiar cache al salir
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ═══════════════════════════════════════════════
  // HELPERS DE UI (CLASES CSS DINÁMICAS)
  // ═══════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════
  // UTILIDADES PRIVADAS
  // ═══════════════════════════════════════════════

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