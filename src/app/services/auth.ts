// src/app/services/auth.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // LOGIN
  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  // REGISTRO
  register(data: any) {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  // GUARDAR SESIÓN
  saveSession(response: any): void {
    localStorage.setItem('token', response.token);

    // Guardar usuario si viene en la respuesta
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
  }

  // OBTENER TOKEN
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // OBTENER USUARIO
  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // VERIFICAR SI ESTÁ AUTENTICADO
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }

  // CERRAR SESIÓN
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // OBTENER ROL DEL USUARIO
  getRole(): string {
    const user = this.getUser();
    return user?.rol?.nombre_rol || user?.rol || '';
  }

  // VALIDAR SI TIENE UN ROL ESPECÍFICO
  hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  // VALIDAR SI ES ADMINISTRADOR
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // VALIDAR SI ES FUNCIONARIO
  isFuncionario(): boolean {
    return this.hasRole('FUNCIONARIO');
  }

  // VALIDAR SI ES CIUDADANO
  isCiudadano(): boolean {
    return this.hasRole('CIUDADANO');
  }
}