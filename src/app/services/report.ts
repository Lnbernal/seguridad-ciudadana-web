import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Report {
  private apiUrl = 'http://localhost:8080/api/reports';

  constructor(private http: HttpClient) {}

  create(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}