import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { Auth } from '../../services/auth';
import { Report } from '../../services/report';

Chart.register(...registerables, ChartDataLabels);

interface StatItem {
  label: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './statistics.html',
  styleUrls: ['./statistics.css']
})
export class Statistics implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('activityChart') activityChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('municipalityChart') municipalityChartRef?: ElementRef<HTMLCanvasElement>;

  chartColors = [
    '#22c55e',
    '#60a5fa',
    '#f59e0b',
    '#a78bfa',
    '#ef4444',
    '#14b8a6'
  ];

  loading = true;
  error = '';
  reports: any[] = [];

  totalReportes = 0;
  reportesConUbicacion = 0;
  reportesAlta = 0;
  tasaResolucion = 0;

  byStatus: StatItem[] = [];
  byPriority: StatItem[] = [];
  byCategory: StatItem[] = [];
  byMunicipality: StatItem[] = [];
  recentReports: any[] = [];

  private charts: Chart[] = [];
  private viewReady = false;

  constructor(
    private reportService: Report,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadStatistics(): void {
    this.loading = true;
    this.error = '';

    this.reportService.getAll().subscribe({
      next: (response: any) => {
        this.reports = this.normalizeResponse(response);
        this.buildStatistics();
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (err: any) => {
        console.error('Error cargando estadísticas:', err);
        this.error = 'No se pudieron cargar las estadísticas.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getStatus(report: any): string {
    return (
      report?.estados_reporte?.nombre_estado ||
      report?.estado?.nombre_estado ||
      'Pendiente'
    ).toString().trim();
  }

  getCategory(report: any): string {
    return (
      report?.categoria?.nombre_categoria ||
      report?.category?.nombre_categoria ||
      'Sin categoría'
    ).toString().trim();
  }

  getMunicipality(report: any): string {
    return (
      report?.municipio?.nombre ||
      report?.municipality?.nombre ||
      'Sin municipio'
    ).toString().trim();
  }

  getPriority(report: any): string {
    return (report?.prioridad || 'MEDIA').toString().trim().toUpperCase();
  }

  getStatusClass(report: any): string {
    const status = this.getStatus(report).toLowerCase().trim();
    if (status.includes('pendiente')) return 'pending';
    if (status.includes('proceso')) return 'in-progress';
    if (status.includes('resuelto')) return 'resolved';
    if (status.includes('rechazado')) return 'rejected';
    return '';
  }

  getCategoryColor(label: string): string {
    const palette = [
      '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6',
      '#ef4444', '#06b6d4', '#f97316', '#ec4899',
    ];
    const index = this.byCategory.findIndex(c => c.label === label);
    return palette[index % palette.length] || '#22c55e';
  }

  trackByLabel(_: number, item: StatItem): string {
    return item.label;
  }

  private buildStatistics(): void {
    this.totalReportes = this.reports.length;
    this.reportesConUbicacion = this.reports.filter(report => this.hasCoordinates(report)).length;
    this.reportesAlta = this.reports.filter(report => this.getPriority(report) === 'ALTA').length;

    const resueltos = this.reports.filter(report =>
      this.getStatus(report).toLowerCase().includes('resuelto')
    ).length;

    this.tasaResolucion = this.totalReportes > 0
      ? Math.round((resueltos / this.totalReportes) * 100)
      : 0;

    this.byStatus = this.groupBy(report => this.getStatus(report));
    this.byPriority = this.groupBy(report => this.getPriority(report));
    this.byCategory = this.groupBy(report => this.getCategory(report)).slice(0, 6);
    this.byMunicipality = this.groupBy(report => this.getMunicipality(report)).slice(0, 6);

    this.recentReports = [...this.reports]
      .sort((a, b) => Number(b.id_reporte || 0) - Number(a.id_reporte || 0))
      .slice(0, 5);
  }

  private renderCharts(): void {
    if (!this.viewReady || this.loading || this.error) return;

    this.destroyCharts();

    this.createChart(this.activityChartRef, this.getActivityConfig());
    this.createChart(this.statusChartRef, this.getDoughnutConfig('Estados', this.byStatus));
    this.createChart(this.priorityChartRef, this.getPriorityBarConfig());
    this.createChart(this.municipalityChartRef, this.getMunicipalityBarConfig());
  }

  private createChart(
    ref: ElementRef<HTMLCanvasElement> | undefined,
    config: ChartConfiguration
  ): void {
    if (!ref?.nativeElement) return;
    this.charts.push(new Chart(ref.nativeElement, config));
  }

  private destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  private getActivityConfig(): ChartConfiguration<'line'> {
    const activity = this.getActivityByDay();
    const resolvedActivity = this.getResolvedActivityByDay();

    const canvas = this.activityChartRef?.nativeElement;
    let gradient: CanvasGradient | undefined;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        gradient = ctx.createLinearGradient(0, 0, 0, 280);
        gradient.addColorStop(0, 'rgba(34,197,94,0.35)');
        gradient.addColorStop(1, 'rgba(34,197,94,0.02)');
      }
    }

    return {
      type: 'line',
      data: {
        labels: activity.map(item => item.label),
        datasets: [
          {
            label: 'Creados',
            data: activity.map(item => item.value),
            borderColor: '#22c55e',
            backgroundColor: gradient || 'rgba(34,197,94,0.12)',
            pointBackgroundColor: '#0b1427',
            pointBorderColor: '#4ade80',
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Resueltos',
            data: resolvedActivity.map(item => item.value),
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.1)',
            pointBackgroundColor: '#0b1427',
            pointBorderColor: '#93c5fd',
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.4,
            fill: true,
          }
        ]
      },
      options: {
        ...this.getBaseOptions('line'),
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, labels: { color: '#cbd5e1', boxWidth: 12, padding: 16 } }
        }
      }
    };
  }

  private getDoughnutConfig(title: string, items: StatItem[]): ChartConfiguration<'doughnut'> {
    return {
      type: 'doughnut',
      data: {
        labels: items.map(item => item.label),
        datasets: [
          {
            label: title,
            data: items.map(item => item.value),
            backgroundColor: items.map((_, index) => this.chartColors[index % this.chartColors.length]),
            borderColor: '#0b1427',
            borderWidth: 3,
            hoverOffset: 8
          }
        ]
      },
      options: {
        ...this.getBaseOptions('doughnut'),
        cutout: '64%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#cbd5e1' } },
          tooltip: { enabled: true }
        }
      }
    };
  }

  private getPriorityBarConfig(): ChartConfiguration<'bar'> {
    const items = this.byPriority;
    return {
      type: 'bar',
      data: {
        labels: items.map(i => i.label),
        datasets: [{
          label: 'Prioridad',
          data: items.map(i => i.value),
          backgroundColor: items.map((_, i) => this.chartColors[i % this.chartColors.length]),
          borderRadius: 10,
        }]
      },
      options: {
        ...this.getBaseOptions('bar'),
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#fff',
            font: { weight: 'bold', size: 11 },
            formatter: (val) => val
          }
        }
      }
    };
  }

  private getMunicipalityBarConfig(): ChartConfiguration<'bar'> {
    const items = this.byMunicipality;
    return {
      type: 'bar',
      data: {
        labels: items.map(i => i.label),
        datasets: [{
          label: 'Municipios',
          data: items.map(i => i.value),
          backgroundColor: items.map((_, i) => this.chartColors[i % this.chartColors.length]),
          borderRadius: 10,
        }]
      },
      options: {
        ...this.getBaseOptions('bar'),
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#fff',
            font: { weight: 'bold', size: 11 },
            formatter: (val) => val
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.08)' },
            ticks: { color: '#94a3b8', precision: 0 }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#cbd5e1' }
          }
        }
      }
    };
  }

  private getBaseOptions(type: ChartType): any {
    const showScales = type === 'line' || type === 'bar';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type !== 'line' && type !== 'bar',
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            boxWidth: 10,
            boxHeight: 10,
            padding: 14,
            font: { size: 11, weight: 700 }
          }
        },
        tooltip: {
          backgroundColor: '#020617',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1',
          padding: 12
        }
      },
      scales: showScales
        ? {
            x: {
              grid: { color: 'rgba(148,163,184,0.08)' },
              ticks: { color: '#94a3b8' }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(148,163,184,0.08)' },
              ticks: { color: '#94a3b8', precision: 0 }
            }
          }
        : undefined
    };
  }

  private getActivityByDay(): StatItem[] {
    const days = 7;
    const today = new Date();
    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - index - 1));
      const key = date.toISOString().substring(0, 10);
      return {
        key,
        label: date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
        value: 0,
        percent: 0
      };
    });

    this.reports.forEach(report => {
      if (!report?.fecha_reporte) return;
      const key = new Date(report.fecha_reporte).toISOString().substring(0, 10);
      const bucket = buckets.find(item => item.key === key);
      if (bucket) bucket.value += 1;
    });

    return buckets;
  }

  private getResolvedActivityByDay(): StatItem[] {
    const days = 7;
    const today = new Date();
    const buckets = Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));
      return {
        key: date.toISOString().substring(0, 10),
        label: '',
        value: 0,
        percent: 0
      };
    });

    this.reports.forEach(report => {
      if (!report?.fecha_reporte || !this.getStatus(report).toLowerCase().includes('resuelto')) return;
      const key = new Date(report.fecha_reporte).toISOString().substring(0, 10);
      const bucket = buckets.find(b => b.key === key);
      if (bucket) bucket.value += 1;
    });

    return buckets.map((b, idx) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - idx - 1));
      return { ...b, label: d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) };
    });
  }

  private groupBy(getKey: (report: any) => string): StatItem[] {
    const totals = new Map<string, number>();
    this.reports.forEach(report => {
      const key = getKey(report) || 'Sin dato';
      totals.set(key, (totals.get(key) || 0) + 1);
    });

    return Array.from(totals.entries())
      .map(([label, value]) => ({
        label,
        value,
        percent: this.totalReportes > 0 ? Math.round((value / this.totalReportes) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  private normalizeResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.reports)) return response.reports;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }

  private hasCoordinates(report: any): boolean {
    const lat = Number(report?.latitud);
    const lng = Number(report?.longitud);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }
}