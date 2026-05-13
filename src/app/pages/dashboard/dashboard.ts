// src/app/pages/dashboard/dashboard.ts

import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {
  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}