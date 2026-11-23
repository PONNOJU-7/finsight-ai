import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-8">
            <a routerLink="/dashboard" class="flex items-center gap-2">
              <span class="text-xl font-bold text-indigo-600">FinSight</span>
              <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">AI</span>
            </a>
            <div class="hidden md:flex items-center gap-6">
              <a routerLink="/dashboard" routerLinkActive="text-indigo-600 font-semibold"
                 class="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Dashboard</a>
              <a routerLink="/upload" routerLinkActive="text-indigo-600 font-semibold"
                 class="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Upload Statement</a>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">{{ authService.currentUser()?.name }}</span>
            <button (click)="authService.logout()"
              class="text-sm text-gray-600 hover:text-red-500 transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-200">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}
}
