// src/app/pages/edit-report/edit-report.ts

import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterModule
} from '@angular/router';

import * as L from 'leaflet';

import { Report } from '../../services/report';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-edit-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterModule
  ],
  templateUrl: './edit-report.html',
  styleUrls: ['./edit-report.css']
})
export class EditReport implements OnInit {
  id!: number;

  form = {
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA',
    direccion: '',
    anonimo: false,
    latitud: '',
    longitud: '',
    fecha_reporte: '',
    id_categoria: null as number | null,
    id_municipio: null as number | null,
    id_usuario: null as number | null
  };

  loading = true;
  saving = false;
  error = '';
  success = '';

  // Leaflet
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: Report,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Cargando reporte con ID:', this.id);
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    this.error = '';

    this.reportService.getById(this.id).subscribe({
      next: (report: any) => {
        console.log('Reporte recibido:', report);

        this.form = {
          titulo: report.titulo || '',
          descripcion: report.descripcion || '',
          prioridad: report.prioridad || 'MEDIA',
          direccion: report.direccion || '',
          anonimo: report.anonimo ?? false,
          latitud: report.latitud ? String(report.latitud) : '',
          longitud: report.longitud ? String(report.longitud) : '',
          fecha_reporte: report.fecha_reporte
            ? report.fecha_reporte.substring(0, 10)
            : '',
          id_categoria: report.id_categoria ?? null,
          id_municipio: report.id_municipio ?? null,
          id_usuario: report.id_usuario ?? null
        };

        // Mostrar formulario
        this.loading = false;
        this.cdr.detectChanges();

        // Inicializar mapa cuando el DOM ya exista
        setTimeout(() => {
          this.initMap();
        }, 100);
      },

      error: (err: any) => {
        console.error('Error cargando reporte:', err);

        this.error =
          err?.error?.message ||
          err?.error?.error ||
          'No se pudo cargar el reporte.';

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardar(): void {
    if (this.saving) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    const payload = {
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim(),
      prioridad: this.form.prioridad,
      direccion: this.form.direccion.trim(),
      anonimo: this.form.anonimo,

      latitud:
        this.form.latitud !== ''
          ? Number(this.form.latitud)
          : null,

      longitud:
        this.form.longitud !== ''
          ? Number(this.form.longitud)
          : null,

      fecha_reporte: this.form.fecha_reporte || null,

      id_categoria: this.form.id_categoria,
      id_municipio: this.form.id_municipio,
      id_usuario: this.form.id_usuario
    };

    console.log('Payload enviado al backend:', payload);

    this.reportService.update(this.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Reporte actualizado correctamente.';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/reportes']);
        }, 1200);
      },

      error: (err: any) => {
        console.error('Error actualizando reporte:', err);

        this.error =
          err?.error?.message ||
          err?.error?.error ||
          'No se pudo actualizar el reporte.';

        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  initMap(): void {
    const container = document.getElementById('edit-map');

    if (!container) {
      console.warn('Contenedor del mapa no encontrado.');
      return;
    }

    // Destruir mapa previo si existe
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }

    // Coordenadas iniciales
    const lat = this.form.latitud
      ? Number(this.form.latitud)
      : 4.7110;

    const lng = this.form.longitud
      ? Number(this.form.longitud)
      : -74.0721;

    // Configurar iconos de Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    // Crear mapa
    this.map = L.map('edit-map', {
      center: [lat, lng],
      zoom: 15
    });

    // Capa base
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    // Marcador
    this.marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(this.map);

    // Actualizar al arrastrar
    this.marker.on('dragend', () => {
      if (!this.marker) return;

      const pos = this.marker.getLatLng();

      this.form.latitud = pos.lat.toFixed(8);
      this.form.longitud = pos.lng.toFixed(8);

      this.cdr.detectChanges();
    });

    // Actualizar al hacer clic
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      this.form.latitud = lat.toFixed(8);
      this.form.longitud = lng.toFixed(8);

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      }

      this.cdr.detectChanges();
    });

    // Ajustar tamaño del mapa
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}