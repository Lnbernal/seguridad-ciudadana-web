import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      data,
      {
        headers: this.getHeaders()
      }
    );
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      data,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateRole(
    id: number,
    id_rol: number
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/role`,
      { id_rol },
      {
        headers: this.getHeaders()
      }
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }
    changePassword(
    id: number,
    data: {
      currentPassword: string;
      newPassword: string;
    }
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/password`,
      data,
      {
        headers: this.getHeaders()
      }
    );
  }
}