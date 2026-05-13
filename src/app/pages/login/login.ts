// src/app/pages/login/login.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- IMPORTANTE
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, // <-- Agregar esto para que funcione *ngIf
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  form = {
    correo: '',
    password: ''
  };

  error = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  login(): void {
    this.error = '';

    const payload = {
      correo: this.form.correo,
      contraseña: this.form.password
    };

    this.auth.login(payload).subscribe({
      next: (response: any) => {
        this.auth.saveSession(response);
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        console.error('Error en login:', err);
        this.error =
          err?.error?.message ||
          'Credenciales incorrectas';
      }
    });
  }
}