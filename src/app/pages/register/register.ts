import { Component } from '@angular/core';
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
  mensaje = '';
  error = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  registrar(): void {
    this.loading = true;
    this.error = '';
    this.mensaje = '';

    const payload = {
      nombre: this.form.nombre,
      apellido: this.form.apellido,
      correo: this.form.correo,
      contraseña: this.form.password,
      telefono: this.form.telefono
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.mensaje = 'Cuenta creada correctamente.';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err: any) => {
        this.error =
          err?.error?.message ||
          'No fue posible completar el registro.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}