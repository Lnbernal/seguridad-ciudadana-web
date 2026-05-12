import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Municipality {
  private apiUrl = 'http://localhost:8080/api/municipalities';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(
      this.apiUrl,
      {
        headers: this.getHeaders()
      }
    );
  }
}