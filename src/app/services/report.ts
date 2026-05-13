import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

export interface ReportModel {
  id_reporte: number;
  titulo: string;
  descripcion: string;
  fecha_reporte: string;
  prioridad: string;
}

@Injectable({
  providedIn: 'root'
})
export class Report {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getAll(): Observable<ReportModel[]> {
    return this.http.get<ReportModel[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
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
    return this.http.post(this.apiUrl, data, {
      headers: this.getHeaders()
    });
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