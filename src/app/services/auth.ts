// src/app/services/auth.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // ======================================================
  // LOGIN
  // ======================================================
  login(credentials: {
    correo: string;
    contraseña: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      credentials
    );
  }

  // ======================================================
  // REGISTRO
  // ======================================================
  register(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/register`,
      data
    );
  }

  // ======================================================
  // GUARDAR SESIÓN
  // ======================================================
  saveSession(response: any): void {
    if (response?.token) {
      localStorage.setItem('token', response.token);
    }

    const user =
      response?.user ||
      response?.usuario ||
      response?.data?.user ||
      response?.data?.usuario;

    if (user) {
      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );
    }

    console.log('Usuario guardado:', this.getUser());
    console.log('Rol detectado:', this.getRole());
  }

  // ======================================================
  // LOGOUT
  // ======================================================
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ======================================================
  // AUTENTICACIÓN
  // ======================================================
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Compatibilidad con tu guard
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  // ======================================================
  // TOKEN
  // ======================================================
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ======================================================
  // USUARIO
  // ======================================================
  getUser(): any {
    const rawUser = localStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch (error) {
      console.error(
        'Error leyendo usuario del localStorage:',
        error
      );
      return null;
    }
  }

  // ======================================================
  // ROL NORMALIZADO
  // ======================================================
  getRole(): string {
    const user = this.getUser();

    const rawRole =
      user?.rol ||
      user?.role ||
      user?.nombre_rol ||
      user?.rol_nombre ||
      user?.rol?.nombre_rol ||
      user?.rol?.nombre ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      '';

    return rawRole
      .toString()
      .trim()
      .toUpperCase();
  }

  // ======================================================
  // PERMISOS
  // ======================================================
  isAdmin(): boolean {
    const role = this.getRole();

    return (
      role === 'ADMIN' ||
      role === 'ADMINISTRADOR'
    );
  }

  canEditReports(): boolean {
    const role = this.getRole();

    return [
      'ADMIN',
      'ADMINISTRADOR',
      'FUNCIONARIO'
    ].includes(role);
  }

  canDeleteReports(): boolean {
    return this.isAdmin();
  }
}