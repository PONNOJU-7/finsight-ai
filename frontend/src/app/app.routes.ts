import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'upload',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/upload/upload.component').then(m => m.UploadComponent),
  },
  {
    path: 'analysis/:statementId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/analysis/analysis.component').then(m => m.AnalysisComponent),
  },
  {
    path: 'chat/:statementId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];
