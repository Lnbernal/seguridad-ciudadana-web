// src/app/app.routes.ts

import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { ReportForm } from './pages/report-form/report-form';
import { ReportList } from './pages/report-list/report-list';
import { ReportDetail } from './pages/report-detail/report-detail';
import { EditReport } from './pages/edit-report/edit-report';
import { AdminUsers } from './pages/admin-users/admin-users';
import { AdminMapa } from './pages/admin-mapa/admin-mapa';
import { authGuard } from './guards/auth';
import { Configuracion } from './pages/configuracion/configuracion';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [

  // ═══════════════════════════════════════════════
  // RUTAS PÚBLICAS
  // ═══════════════════════════════════════════════
  {
    path: '',
    component: Home
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },

  // ═══════════════════════════════════════════════
  // DASHBOARD (Autenticado)
  // ═══════════════════════════════════════════════
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  // ═══════════════════════════════════════════════
  // REPORTES (Autenticado)
  // ═══════════════════════════════════════════════
  {
    path: 'reportes',
    component: ReportList,
    canActivate: [authGuard]
  },
  {
    path: 'reportes/:id',
    component: ReportDetail,
    canActivate: [authGuard]
  },
  {
    path: 'reportes/editar/:id',
    component: EditReport,
    canActivate: [authGuard]
  },

  // ═══════════════════════════════════════════════
  // NUEVO REPORTE (Autenticado + Roles)
  // ═══════════════════════════════════════════════
  {
    path: 'nuevo-reporte',
    component: ReportForm,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'FUNCIONARIO', 'CIUDADANO', 'ALCALDIA', 'OPERADOR']
    }
  },

  // ═══════════════════════════════════════════════
  // ADMINISTRACIÓN (Solo Admin)
  // ═══════════════════════════════════════════════
  {
    path: 'admin/users',
    component: AdminUsers,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN']
    }
  },
  {
    path: 'admin/mapa',
    component: AdminMapa,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'FUNCIONARIO', 'ALCALDIA', 'OPERADOR']
    }
  },
  {
    path: 'admin/estadisticas',
    component: AdminMapa, // ← Cambiar cuando tengas Estadísticas
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'FUNCIONARIO', 'ALCALDIA']
    }
  },

  // ═══════════════════════════════════════════════
  // CONFIGURACIÓN (Autenticado)
  // ═══════════════════════════════════════════════
  {
    path: 'configuracion',
    component: Configuracion,
    canActivate: [authGuard]
  },

  // ═══════════════════════════════════════════════
  // FALLBACK
  // ═══════════════════════════════════════════════
  {
    path: '**',
    redirectTo: ''
  }
];