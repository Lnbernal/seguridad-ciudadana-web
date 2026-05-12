import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { ReportForm } from './pages/report-form/report-form';
import { ReportList } from './pages/report-list/report-list';

export const routes: Routes = [

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

    {
        path: 'dashboard',
        component: Dashboard
    },

    {
        path: 'nuevo-reporte',
        component: ReportForm
    },

    {
        path: 'mis-reportes',
        component: ReportList
    }

];