import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatbotService } from '../../services/chatbot';

interface Mensaje {
  texto: string;
  usuario: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})
export class Chatbot {

  abierto = false;

  cargando = false;

  mensaje = '';

  mensajes: Mensaje[] = [
    {
      texto: 'Hola, soy Eduard Porras. ¿En qué puedo ayudarte?',
      usuario: false
    }
  ];

  constructor(
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef
  ) {}

  toggleChat(): void {

    this.abierto = !this.abierto;

  }

  enviarMensaje(): void {

    if (!this.mensaje.trim()) {
      return;
    }

    const textoUsuario = this.mensaje;

    this.mensajes.push({
      texto: textoUsuario,
      usuario: true
    });

    this.mensaje = '';

    this.cargando = true;

    this.chatbotService
      .enviarMensaje(textoUsuario)
      .subscribe({

        next: (response: any) => {

          console.log(response);

          this.cargando = false;

          this.mensajes.push({
            texto:
              response?.respuesta ||
              'Sin respuesta del servidor',
            usuario: false
          });

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(error);

          this.cargando = false;

          this.mensajes.push({
            texto: 'Ocurrió un error conectando con el asistente.',
            usuario: false
          });

          this.cdr.detectChanges();

        }

      });

  }

}