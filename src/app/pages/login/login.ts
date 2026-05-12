import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  form: FormGroup;

  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.form = this.fb.group({

      correo: ['', [Validators.required, Validators.email]],

      contraseña: ['', Validators.required]

    });

  }

  onSubmit() {

    if (this.form.invalid) return;

    this.authService.login(this.form.value).subscribe({

      next: (resp) => {

        console.log(resp);

        this.authService.saveToken(resp.token);

        this.router.navigate(['/dashboard']);

      },

      error: (err) => {

        console.error(err);

        this.error = err.error.message;

      }

    });

  }

}