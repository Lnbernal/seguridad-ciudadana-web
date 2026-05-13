// src/app/pages/admin-users/admin-users.ts

import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { User } from '../../services/user';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {
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
    if (!this.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadUsers();
  }

  // ======================================
  // VALIDAR SI ES ADMIN
  // ======================================
  isAdmin(): boolean {
    const user = this.auth.getUser();

    // Validar directamente por id_rol
    if (Number(user?.id_rol) === 1) {
      return true;
    }

    // Validar por nombre del rol
    const role =
      user?.rol ||
      user?.role ||
      user?.nombre_rol ||
      user?.rol_nombre ||
      user?.rol?.nombre_rol ||
      user?.rol?.nombre ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      '';

    return (
      role.toString().trim().toUpperCase() === 'ADMIN'
    );
  }

  // ======================================
  // CARGAR USUARIOS
  // ======================================
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
          id_rol: Number(
            user.id_rol ||
            user.rol?.id_rol ||
            user.role?.id_rol ||
            3
          )
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando usuarios:', err);

        this.error =
          err?.error?.message ||
          'No se pudieron cargar los usuarios.';

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ======================================
  // ACTUALIZAR ROL
  // ======================================
  updateRole(user: any): void {
    const payload = {
      id_rol: Number(user.id_rol)
    };

    console.log(
      'Actualizando usuario:',
      user.id_usuario,
      payload
    );

    // Si en tu servicio existe updateRole()
    this.userService
        .updateRole(
          user.id_usuario,
          Number(user.id_rol)
        )
        .subscribe({
        next: (response: any) => {
          console.log('Rol actualizado:', response);
          alert('Rol actualizado correctamente.');
          this.loadUsers();
        },
        error: (err: any) => {
          console.error('Error actualizando rol:', err);

          alert(
            err?.error?.message ||
            'No se pudo actualizar el rol.'
          );
        }
      });
  }

  // ======================================
  // CERRAR SESIÓN
  // ======================================
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}