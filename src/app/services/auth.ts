import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: {
    correo: string;
    contraseña: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      credentials
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/register`,
      data
    );
  }

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
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const rawUser = localStorage.getItem('user');

    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }

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

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  canEditReports(): boolean {
    return ['ADMIN', 'OPERADOR', 'ALCALDIA']
      .includes(this.getRole());
  }

  canDeleteReports(): boolean {
    return this.isAdmin();
  }
}