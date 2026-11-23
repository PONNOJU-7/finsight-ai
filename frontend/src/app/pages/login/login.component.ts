import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 mb-4">
            <span class="text-3xl font-bold text-indigo-600">FinSight</span>
            <span class="text-sm bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">AI</span>
          </div>
          <p class="text-gray-500 text-sm">AI-powered financial health analyzer</p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Welcome back</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" formControlName="email"
                class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="you@example.com" />
              <p *ngIf="form.get('email')?.touched && form.get('email')?.invalid"
                 class="text-red-500 text-xs mt-1">Valid email required</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" formControlName="password"
                class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="••••••••" />
            </div>

            <p *ngIf="error()" class="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{{ error() }}</p>

            <button type="submit" [disabled]="loading() || form.invalid"
              class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            Don't have an account?
            <a routerLink="/register" class="text-indigo-600 font-semibold hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal('');

  constructor(fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message?.error ?? err.error?.message ?? 'Login failed');
        this.loading.set(false);
      },
    });
  }
}
