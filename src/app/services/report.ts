
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReportModel {
  id_reporte: number;
  titulo: string;
  descripcion: string;
  fecha_reporte: string;
  prioridad: string;
  categoria?: {
    nombre_categoria: string;
  };
  municipio?: {
    nombre: string;
  };
  estados_reporte?: {
    nombre_estado: string;
  };
  usuario?: {
    nombre: string;
    apellido: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class Report {
  private apiUrl = 'http://localhost:8080/api/reports';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getAll(): Observable<ReportModel[]> {
    return this.http.get<ReportModel[]>(
      this.apiUrl,
      {
        headers: this.getHeaders()
      }
    );
  }

  getById(id: number): Observable<ReportModel> {
    return this.http.get<ReportModel>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }

  create(data: any): Observable<any> {
    return this.http.post(
      this.apiUrl,
      data,
      {
        headers: this.getHeaders()
      }
    );
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      data,
      {
        headers: this.getHeaders()
      }
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }
}