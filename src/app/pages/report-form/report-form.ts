import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Report } from '../../services/report';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-form.html',
  styleUrl: './report-form.css'
})
export class ReportForm {

  titulo = '';
  descripcion = '';
  id_categoria = '';
  id_municipio = '';
  archivo!: File;

  constructor(
    private reportService: Report,
    private router: Router
  ) {}

  onFileSelected(event: any) {
    this.archivo = event.target.files[0];
  }

  onSubmit() {
    const formData = new FormData();

    formData.append('titulo', this.titulo);
    formData.append('descripcion', this.descripcion);
    formData.append('id_categoria', this.id_categoria);
    formData.append('id_municipio', this.id_municipio);

    if (this.archivo) {
      formData.append('evidencia', this.archivo);
    }

    this.reportService.create(formData).subscribe({
      next: () => {
        alert('Reporte creado correctamente');
        this.router.navigate(['/reportes']);
      },
      error: (error) => {
        console.error(error);
        alert('Error al crear el reporte');
      }
    });
  }
}