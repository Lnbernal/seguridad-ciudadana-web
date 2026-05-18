// src/app/pages/configuracion/configuracion.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Auth } from '../../services/auth';
import { User } from '../../services/user';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css']
})
export class Configuracion implements OnInit {

  usuario = 'Usuario';

  // Perfil
  profile = { nombre: '', apellido: '', correo: '' };
  savingProfile = false;

  // Contraseña
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  savingPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Preferencias
  preferences = {
    emailNotifications: true,
    weeklySummary: false
  };

  // Mensajes
  successMessage = '';
  errorMessage = '';

  constructor(
    private auth: Auth,
    private userService: User,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  // ═══════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════

  loadUserData(): void {
    const user = this.auth.getUser();
    if (user) {
      this.usuario = user.nombre || user.correo || 'Usuario';
      this.profile.nombre = user.nombre || '';
      this.profile.apellido = user.apellido || '';
      this.profile.correo = user.correo || '';
    }

    // Cargar preferencias guardadas
    const prefs = localStorage.getItem('user_preferences');
    if (prefs) {
      try {
        this.preferences = { ...this.preferences, ...JSON.parse(prefs) };
      } catch (e) {
        console.warn('Preferencias corruptas, usando defaults');
      }
    }
  }

  // ═══════════════════════════════════════════════
  // PERFIL
  // ═══════════════════════════════════════════════

  updateProfile(): void {
    if (!this.profile.nombre.trim() || !this.profile.apellido.trim()) {
      this.showError('El nombre y apellido son obligatorios.');
      return;
    }

    this.clearMessages();
    this.savingProfile = true;

    const user = this.auth.getUser();
    const id_usuario = user?.id_usuario || user?.id;

    if (!id_usuario) {
      this.showError('No se pudo identificar al usuario.');
      this.savingProfile = false;
      return;
    }

    this.userService.update(id_usuario, {
      nombre: this.profile.nombre.trim(),
      apellido: this.profile.apellido.trim()
    }).subscribe({
      next: () => {
        // Actualizar sesión local
        const session = localStorage.getItem('session');
        if (session) {
          try {
            const data = JSON.parse(session);
            data.usuario.nombre = this.profile.nombre.trim();
            data.usuario.apellido = this.profile.apellido.trim();
            localStorage.setItem('session', JSON.stringify(data));
          } catch (e) {
            console.error('Error actualizando sesión local:', e);
          }
        }

        this.usuario = this.profile.nombre.trim();
        this.showSuccess('Perfil actualizado correctamente.');
        this.savingProfile = false;
      },
      error: (err: any) => {
        this.showError(err?.error?.message || 'No se pudo actualizar el perfil.');
        this.savingProfile = false;
      }
    });
  }

  // ═══════════════════════════════════════════════
  // CONTRASEÑA
  // ═══════════════════════════════════════════════

  changePassword(): void {
    if (!this.passwordForm.currentPassword) {
      this.showError('Ingresa tu contraseña actual.');
      return;
    }
    if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 6) {
      this.showError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showError('Las contraseñas no coinciden.');
      return;
    }

    this.clearMessages();
    this.savingPassword = true;

    const user = this.auth.getUser();
    const id_usuario = user?.id_usuario || user?.id;

    if (!id_usuario) {
      this.showError('No se pudo identificar al usuario.');
      this.savingPassword = false;
      return;
    }

    this.userService.changePassword(id_usuario, {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.showSuccess('Contraseña actualizada correctamente.');
        this.savingPassword = false;
      },
      error: (err: any) => {
        this.showError(err?.error?.message || 'No se pudo cambiar la contraseña.');
        this.savingPassword = false;
      }
    });
  }

  // ═══════════════════════════════════════════════
  // PREFERENCIAS
  // ═══════════════════════════════════════════════

  savePreferences(): void {
    localStorage.setItem('user_preferences', JSON.stringify(this.preferences));
    this.showSuccess('Preferencias guardadas.');
  }

  // ═══════════════════════════════════════════════
  // ELIMINAR CUENTA
  // ═══════════════════════════════════════════════

  confirmDeleteAccount(): void {
    const confirmar = confirm(
      '¿Estás completamente seguro de eliminar tu cuenta?\n\n' +
      'Esta acción es irreversible: se perderán todos tus reportes, evidencias y datos asociados.'
    );

    if (!confirmar) return;

    const dobleConfirmacion = confirm(
      'Última advertencia: ¿Realmente deseas eliminar tu cuenta para siempre?'
    );

    if (!dobleConfirmacion) return;

    this.deleteAccount();
  }

  private deleteAccount(): void {
    const user = this.auth.getUser();
    const id_usuario = user?.id_usuario || user?.id;

    if (!id_usuario) {
      this.showError('No se pudo identificar al usuario.');
      return;
    }

    this.userService.delete(id_usuario).subscribe({
      next: () => {
        alert('Cuenta eliminada. Lamentamos verte partir.');
        this.auth.logout();
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.showError(err?.error?.message || 'No se pudo eliminar la cuenta.');
      }
    });
  }

  // ═══════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════

  isAdmin(): boolean {
    const user = this.auth.getUser();
    const role = (user?.rol || user?.role?.nombre_rol || '').toString().trim().toUpperCase();
    return role === 'ADMIN' || role === 'ADMINISTRADOR';
  }

  logout(): void {
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('report_list_cache');
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 4000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}