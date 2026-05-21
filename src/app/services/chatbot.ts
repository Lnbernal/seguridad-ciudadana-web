import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  enviarMensaje(mensaje: string): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      { mensaje }
    );

  }

}