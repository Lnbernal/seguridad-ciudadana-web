import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { Report } from '../../services/report';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-detail.html',
  styleUrls: ['./report-detail.css']
})
export class ReportDetail implements OnInit {
  report: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private reportService: Report,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.error = 'ID de reporte inválido';
      this.loading = false;
      return;
    }

    this.reportService.getById(id).subscribe({
      next: (data: any) => {
        this.report = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'No se pudo cargar el reporte';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getFileUrl(filename: string): string {
    return `http://localhost:8080/uploads/${filename}`;
  }

  isImage(mimeType: string): boolean {
    return mimeType?.startsWith('image/');
  }

  isVideo(mimeType: string): boolean {
    return mimeType?.startsWith('video/');
  }
}