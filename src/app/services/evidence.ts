// src/app/services/evidence.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Evidence {
  private apiUrl = 'http://localhost:8080/api/evidences';

  constructor(private http: HttpClient) {}

  upload(file: File, idReporte: number): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    // IMPORTANTE:
    // El nombre del campo debe llamarse exactamente "archivo"
    // porque en el backend usas:
    // upload.single('archivo')
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