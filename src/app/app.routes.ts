// src/app/app.routes.ts

import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { ReportForm } from './pages/report-form/report-form';
import { ReportList } from './pages/report-list/report-list';
import { ReportDetail } from './pages/report-detail/report-detail';
import { AdminUsers } from './pages/admin-users/admin-users';
import { authGuard } from './guards/auth';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // =========================
  // RUTAS PÚBLICAS
  // =========================
  {
  path: 'admin/users',
  component: AdminUsers
  },
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

  // =========================
  // DASHBOARD
  // =========================
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  // =========================
  // LISTADO DE REPORTES
  // =========================
  {
    path: 'reportes',
    component: ReportList,
    canActivate: [authGuard]
  },

  // =========================
  // CREAR REPORTE
  // =========================
  {
    path: 'nuevo-reporte',
    component: ReportForm,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'FUNCIONARIO', 'CIUDADANO']
    }
  },

  // =========================
  // VER DETALLE
  // =========================
  {
    path: 'reportes/:id',
    component: ReportDetail,
    canActivate: [authGuard]
  },

  // =========================
  // EDITAR REPORTE
  // (usa ReportForm por ahora)
  // =========================
  {
    path: 'reportes/editar/:id',
    component: ReportForm,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'FUNCIONARIO']
    }
  },

  // =========================
  // FALLBACK
  // =========================
  {
    path: '**',
    redirectTo: ''
  }
];