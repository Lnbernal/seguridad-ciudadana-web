import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  nombre = '';
  apellido = '';
  correo = '';
  contrasena = '';
  telefono = '';

  mensaje = '';
  error = '';

  constructor(private http: HttpClient) {}

  registrar() {

    const body = {
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
      contraseña: this.contrasena,
      telefono: this.telefono
    };

    this.http.post(
      'http://localhost:8080/api/auth/register',
      body
    ).subscribe({
      next: (res: any) => {
        console.log(res);

        this.mensaje = 'Usuario registrado correctamente';
        this.error = '';
      },

      error: (err) => {
        console.log(err);

        this.error = 'Error al registrar usuario';
        this.mensaje = '';
      }
    });

  }

}