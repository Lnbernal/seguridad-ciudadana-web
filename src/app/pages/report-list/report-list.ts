import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Report } from '../../services/report';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-list.html',
  styleUrl: './report-list.css'
})
export class ReportList implements OnInit {

  reportes: any[] = [];
  cargando = true;

  constructor(private reportService: Report) {}

  ngOnInit(): void {
    this.obtenerReportes();
  }

  obtenerReportes() {
    this.reportService.getAll().subscribe({
      next: (response) => {
        this.reportes = response;
        this.cargando = false;
      },
      error: (error) => {
        console.error(error);
        this.cargando = false;
      }
    });
  }
}