import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-navbar *ngIf="authService.isLoggedIn()"></app-navbar>
      <main [class]="authService.isLoggedIn() ? 'pt-16' : ''">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
