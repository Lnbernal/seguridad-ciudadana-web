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
export class Evidence {
  private apiUrl = `${environment.apiUrl}/evidences`;

  constructor(private http: HttpClient) {}

  upload(file: File, idReporte: number): Observable<any> {
    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('id_reporte', idReporte.toString());

    return this.http.post(
      `${this.apiUrl}/upload`,
      formData,
      { headers }
    );
  }
}