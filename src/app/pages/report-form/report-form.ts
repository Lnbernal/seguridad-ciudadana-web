// src/app/pages/report-form/report-form.ts

import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router,RouterModule  } from '@angular/router';

import * as L from 'leaflet';

import { Report } from '../../services/report';
import { Category } from '../../services/category';
import { Municipality } from '../../services/municipality';
import { Evidence } from '../../services/evidence';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './report-form.html',
  styleUrls: ['./report-form.css']
})
export class ReportForm implements OnInit, AfterViewInit {
  loading = false;

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.getLocation();
  }

  ngAfterViewInit(): void {
    // Esperamos a que Angular renderice el contenedor del mapa
    setTimeout(() => this.initMap(), 100);
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
      // Coordenadas por defecto: Chía, Cundinamarca
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
        // Si el usuario no permite geolocalización
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
      {
        enableHighAccuracy: true
      }
    );
  }

  initMap(): void {
    const lat = this.form.latitud ?? 4.8623;
    const lng = this.form.longitud ?? -74.0328;

    this.map = L.map('map').setView([lat, lng], 15);

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    this.marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(this.map);

    // Al arrastrar el marcador
    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updateCoordinates(pos.lat, pos.lng);
    });

    // Al hacer clic en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.updateCoordinates(lat, lng);
    });

    // Corrige tamaño del mapa
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

    const payload = {
      ...this.form,
      id_categoria: Number(this.form.id_categoria),
      id_municipio: Number(this.form.id_municipio),
      id_estado: 1
    };

    this.reportService.create(payload).subscribe({
      next: (response: any) => {
        const reportId =
          response?.report?.id_reporte ||
          response?.id_reporte;

        // Si no hay archivo, finalizar
        if (!this.selectedFile || !reportId) {
          alert('Reporte creado correctamente');
          this.router.navigate(['/reportes']);
          return;
        }

        // Subir evidencia
        this.evidenceService
          .upload(this.selectedFile, reportId)
          .subscribe({
            next: () => {
              alert('Reporte y evidencia guardados correctamente');
              this.router.navigate(['/reportes']);
            },
            error: (err: any) => {
              console.error('Error subiendo evidencia', err);
              alert(
                'Reporte creado, pero la evidencia no pudo subirse'
              );
              this.router.navigate(['/reportes']);
            }
          });
      },

      error: (err: any) => {
        console.error('Error creando reporte', err);
        alert('Error creando reporte');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}