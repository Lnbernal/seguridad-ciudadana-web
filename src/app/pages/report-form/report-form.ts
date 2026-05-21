// src/app/pages/report-form/report-form.ts

import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import * as L from 'leaflet';

import { Report } from '../../services/report';
import { Category } from '../../services/category';
import { Municipality } from '../../services/municipality';
import { Evidence } from '../../services/evidence';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './report-form.html',
  styleUrls: ['./report-form.css']
})
export class ReportForm implements OnInit, AfterViewInit {
  loading = false;

  // ── Datos del usuario ──────────────────────────
  usuario = 'Usuario';

  categorias: any[] = [];
  municipios: any[] = [];

  selectedFile: File | null = null;

  map!: L.Map;
  marker!: L.Marker;

  form = {
    titulo: '',
    descripcion: '',
    fecha_reporte: new Date().toISOString().substring(0, 10),
    latitud: null as number | null,
    longitud: null as number | null,
    direccion: '',
    prioridad: 'MEDIA',
    anonimo: false,
    id_categoria: '',
    id_municipio: '',
    id_estado: 1
  };

  constructor(
    private reportService: Report,
    private categoryService: Category,
    private municipalityService: Municipality,
    private evidenceService: Evidence,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.getLocation();
    this.cargarUsuario();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  // ── Carga nombre del usuario desde sesión ──────
  cargarUsuario(): void {
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const data = JSON.parse(session);
        this.usuario =
          data?.usuario?.nombre ||
          data?.usuario?.correo ||
          'Usuario';
      } catch {
        this.usuario = 'Usuario';
      }
    }
  }

  loadCatalogs(): void {
    this.categoryService.getAll().subscribe({
      next: (data: any[]) => {
        this.categorias = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando categorías', err);
      }
    });

    this.municipalityService.getAll().subscribe({
      next: (data: any[]) => {
        this.municipios = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando municipios', err);
      }
    });
  }

  getLocation(): void {
    if (!navigator.geolocation) {
      this.form.latitud = 4.8623;
      this.form.longitud = -74.0328;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.latitud = position.coords.latitude;
        this.form.longitud = position.coords.longitude;

        if (this.map && this.marker) {
          this.map.setView(
            [this.form.latitud, this.form.longitud],
            16
          );
          this.marker.setLatLng([
            this.form.latitud,
            this.form.longitud
          ]);
        }

        this.cdr.detectChanges();
      },
      () => {
        this.form.latitud = 4.8623;
        this.form.longitud = -74.0328;

        if (this.map && this.marker) {
          this.map.setView(
            [this.form.latitud, this.form.longitud],
            15
          );
          this.marker.setLatLng([
            this.form.latitud,
            this.form.longitud
          ]);
        }

        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true }
    );
  }

  initMap(): void {
    const lat = this.form.latitud ?? 4.8623;
    const lng = this.form.longitud ?? -74.0328;

    this.map = L.map('map').setView([lat, lng], 15);

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors' }
    ).addTo(this.map);

    this.marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updateCoordinates(pos.lat, pos.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.updateCoordinates(lat, lng);
    });

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  updateCoordinates(lat: number, lng: number): void {
    this.form.latitud = Number(lat.toFixed(6));
    this.form.longitud = Number(lng.toFixed(6));
    this.cdr.detectChanges();
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submit(): void {
    this.loading = true;

    const currentUser = this.auth.getUser();

    const userId =
      currentUser?.id_usuario ||
      currentUser?.user?.id_usuario ||
      currentUser?.id ||
      null;

    if (!userId) {
      alert('No se encontró el usuario autenticado.');
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const categoryId = Number(this.form.id_categoria);
    const municipalityId = Number(this.form.id_municipio);

    if (!categoryId || !municipalityId) {
      alert('Selecciona una categoria y un municipio antes de crear el reporte.');
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      ...this.form,
      id_categoria: categoryId,
      id_municipio: municipalityId,
      id_estado: 1,
      id_usuario: Number(userId)
    };

    this.reportService.create(payload).subscribe({
      next: (response: any) => {
        const reportId =
          response?.report?.id_reporte ||
          response?.id_reporte;

        if (!this.selectedFile || !reportId) {
          localStorage.removeItem('dashboard_cache');
          localStorage.removeItem('report_list_cache');
          alert('Reporte creado correctamente');
          this.router.navigate(['/reportes']);
          return;
        }

        this.evidenceService
          .upload(this.selectedFile, reportId)
          .subscribe({
            next: () => {
              localStorage.removeItem('dashboard_cache');
              localStorage.removeItem('report_list_cache');
              alert('Reporte y evidencia guardados correctamente');
              this.router.navigate(['/reportes']);
            },
            error: (err: any) => {
              console.error('Error subiendo evidencia', err);
              alert('Reporte creado, pero la evidencia no pudo subirse');
              this.router.navigate(['/reportes']);
            }
          });
      },
      error: (err: any) => {
        console.error('Error creando reporte', err);
        alert(err?.error?.message || 'Error creando reporte');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Rol del usuario ────────────────────────────
  isAdmin(): boolean {
    const user = this.auth.getUser();
    const role =
      user?.rol ||
      user?.role?.nombre_rol ||
      user?.role?.nombre ||
      '';
    return role.toString().trim().toUpperCase() === 'ADMIN';
  }

  // ── Cerrar sesión ──────────────────────────────
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
