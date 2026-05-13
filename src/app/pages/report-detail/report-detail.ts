// src/app/pages/report-detail/report-detail.ts

import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Report } from '../../services/report';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
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
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadReport(id);
  }

  loadReport(id: number): void {
    this.reportService.getById(id).subscribe({
      next: (data: any) => {
        this.report = data.report || data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'No se pudo cargar el reporte.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}