import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { ReportForm } from './pages/report-form/report-form';
import { ReportList } from './pages/report-list/report-list';
import { ReportDetail } from './pages/report-detail/report-detail';
import { authGuard } from './guards/auth';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  {
  path: 'register',
  loadComponent: () =>
    import('./pages/register/register').then(m => m.Register)
},

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },
  {
    path: 'reportes',
    component: ReportList,
    canActivate: [authGuard]
  },
  {
    path: 'nuevo-reporte',
    component: ReportForm,
    canActivate: [authGuard]
  },
  {
    path: 'reportes/:id',
    component: ReportDetail
  },
  { path: '**', redirectTo: '' }
];