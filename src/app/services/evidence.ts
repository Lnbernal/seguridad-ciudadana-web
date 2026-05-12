// src/app/services/evidence.ts

import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Evidence {
  private apiUrl = 'http://localhost:8080/api/evidences';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  upload(formData: FormData): Observable<any> {
    return this.http.post(
      this.apiUrl,
      formData,
      {
        headers: this.getHeaders()
      }
    );
  }
}