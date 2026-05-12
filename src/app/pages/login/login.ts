import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
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

    console.log('Payload enviado:', payload);

    this.auth.login(payload).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);

        this.auth.saveSession(response);

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error en login:', err);

        this.error =
          err?.error?.message || 'Credenciales incorrectas';

        alert(this.error);
      }
    });
  }
}