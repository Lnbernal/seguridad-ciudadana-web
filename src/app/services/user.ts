// src/app/services/user.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  // ==========================================
  // OBTENER TOKEN DEL LOCALSTORAGE
  // ==========================================
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // ==========================================
  // LISTAR USUARIOS
  // ==========================================
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // OBTENER USUARIO POR ID
  // ==========================================
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // CREAR USUARIO
  // ==========================================
  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // ACTUALIZAR USUARIO COMPLETO
  // ==========================================
  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // ACTUALIZAR SOLO EL ROL
  // ==========================================
  updateRole(id: number, id_rol: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/role`,
      { id_rol },
      {
        headers: this.getHeaders()
      }
    );
  }

  // ==========================================
  // ELIMINAR USUARIO
  // ==========================================
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}