// src/app/pages/admin-users/admin-users.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { User } from '../../services/user';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {

  // ── Datos ──────────────────────────────────────
  usuario = 'Usuario';
  users: any[] = [];
  loading = true;
  error = '';

  roles = [
    { id_rol: 3, nombre_rol: 'ADMIN' },
    { id_rol: 4, nombre_rol: 'ALCALDIA' },
    { id_rol: 2, nombre_rol: 'OPERADOR' },
    { id_rol: 1, nombre_rol: 'CIUDADANO' }
  ];

  constructor(
    private userService: User,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();

    if (!this.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadUsers();
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
          this.usuario = data.usuario.nombre || data.usuario.correo || 'Usuario';
        }
      } catch (e) {
        console.error('Error leyendo sesión:', e);
      }
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.userService.getAll().subscribe({
      next: (response: any) => {
        console.log('Usuarios recibidos:', response);

        if (Array.isArray(response)) {
          this.users = response;
        } else if (Array.isArray(response?.users)) {
          this.users = response.users;
        } else if (Array.isArray(response?.data)) {
          this.users = response.data;
        } else {
          this.users = [];
        }

        // Normalizar datos
        this.users = this.users.map((user: any) => ({
          ...user,
          nuevoRol: Number(
            user.id_rol ||
            user.rol?.id_rol ||
            user.role?.id_rol ||
            1
          ),
          id_rol: Number(
            user.id_rol ||
            user.rol?.id_rol ||
            user.role?.id_rol ||
            1
          ),
          activo: this.normalizarEstado(user.activo ?? user.estado)
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando usuarios:', err);
        this.error = err?.error?.message || 'No se pudieron cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════
  // VALIDACIONES
  // ═══════════════════════════════════════════════

  isAdmin(): boolean {
    const user = this.auth.getUser();

    if (Number(user?.id_rol) === 1) return true;

    const role =
      user?.rol ||
      user?.role ||
      user?.nombre_rol ||
      user?.rol?.nombre_rol ||
      user?.rol?.nombre ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      '';

    return role.toString().trim().toUpperCase() === 'ADMIN';
  }

  // ═══════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════

  /**
   * Actualizar el rol de un usuario.
   */
  updateRole(user: any): void {
    const nuevoRol = Number(user.nuevoRol);

    if (!nuevoRol || nuevoRol === Number(user.id_rol)) {
      alert('Selecciona un rol diferente para actualizar.');
      return;
    }

    console.log('Actualizando usuario:', user.id_usuario, 'nuevo rol:', nuevoRol);

    this.userService.updateRole(user.id_usuario, nuevoRol).subscribe({
      next: (response: any) => {
        console.log('Rol actualizado:', response);
        alert('Rol actualizado correctamente.');
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Error actualizando rol:', err);
        alert(err?.error?.message || 'No se pudo actualizar el rol.');
      }
    });
  }

  /**
 * Activar o desactivar un usuario.
 */
toggleUserStatus(user: any): void {
  const nuevoEstado = !user.activo;
  const accion = nuevoEstado ? 'activar' : 'desactivar';

  const confirmar = confirm(
    `¿Deseas ${accion} al usuario "${user.nombre} ${user.apellido}"?`
  );

  if (!confirmar) return;

  console.log(`${accion} usuario:`, user.id_usuario);

  // Enviar el campo 'estado' como lo espera el backend
  const payload = {
    estado: nuevoEstado  // true = activo, false = inactivo
  };

  this.userService.update(user.id_usuario, payload).subscribe({
    next: (response: any) => {
      console.log(`Usuario ${accion}do:`, response);
      
      // Actualizar el estado local inmediatamente
      user.activo = nuevoEstado;
      
      alert(`Usuario ${accion}do correctamente.`);
      this.cdr.detectChanges();
    },
    error: (err: any) => {
      console.error(`Error al ${accion} usuario:`, err);
      alert(err?.error?.message || `No se pudo ${accion} al usuario.`);
    }
  });
}

  /**
   * Cerrar sesión.
   */
  logout(): void {
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('report_list_cache');
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ═══════════════════════════════════════════════
  // HELPERS DE UI
  // ═══════════════════════════════════════════════

  getIniciales(nombre: string, apellido: string): string {
    return ((nombre?.[0] || '') + (apellido?.[0] || '')).toUpperCase();
  }

  getRoleName(user: any): string {
    return (
      user.rol?.nombre_rol ||
      user.role?.nombre_rol ||
      user.nombre_rol ||
      'Sin rol'
    );
  }

  getRoleClass(user: any): string {
    const role = this.getRoleName(user).toLowerCase().trim();
    if (role.includes('admin'))     return 'role-admin';
    if (role.includes('alcaldia'))  return 'role-alcaldia';
    if (role.includes('operador'))  return 'role-operador';
    if (role.includes('ciudadano')) return 'role-ciudadano';
    return 'role-ciudadano';
  }

  isUsuarioActivo(user: any): boolean {
    return user.activo === true;
  }

  getEstadoUsuarioLabel(user: any): string {
    return this.isUsuarioActivo(user) ? 'Activo' : 'Inactivo';
  }

  getEstadoUsuarioClass(user: any): string {
    return this.isUsuarioActivo(user) ? 'estado-activo' : 'estado-inactivo';
  }

  // ═══════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════

  private normalizarEstado(estado: any): boolean {
    if (typeof estado === 'boolean') return estado;
    if (typeof estado === 'number') return estado === 1;
    if (typeof estado === 'string') {
      const s = estado.toLowerCase().trim();
      return s === 'activo' || s === 'active' || s === '1' || s === 'true';
    }
    return true;
  }
}