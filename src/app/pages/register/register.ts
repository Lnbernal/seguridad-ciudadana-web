// src/app/pages/register/register.ts

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  form = {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    telefono: ''
  };

  loading = false;
  success = false;
  mensaje = '';
  error = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  registrar(): void {
    if (this.loading || this.success) return;

    this.loading = true;
    this.error = '';
    this.mensaje = '';

    // Forzar actualización inmediata de la vista
    this.cdr.detectChanges();

    const payload = {
      nombre: this.form.nombre.trim(),
      apellido: this.form.apellido.trim(),
      correo: this.form.correo.trim(),
      contraseña: this.form.password,
      telefono: this.form.telefono.trim()
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.mensaje = '¡Cuenta creada correctamente! Redirigiendo...';

        // Forzar render del mensaje
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1800);
      },

      error: (err: any) => {
        console.error('Error en registro:', err);

        this.loading = false;
        this.success = false;

        this.error =
          err?.error?.message ||
          err?.error?.error ||
          err?.error?.mensaje ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.message ||
          'No fue posible completar el registro.';

        // Forzar actualización de la vista
        this.cdr.detectChanges();
      }
    });
  }
}