import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto p-6 pt-10">
      <!-- Welcome -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome back, {{ (authService.currentUser()?.name ?? 'there').split(' ')[0] }}
        </h1>
        <p class="text-gray-500 text-sm mt-1">Here's your financial health overview</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex items-center justify-center py-24">
        <div class="text-center">
          <div class="text-4xl animate-pulse mb-3">📊</div>
          <p class="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && !data()?.hasData"
        class="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-12 text-center">
        <div class="text-5xl mb-4">🏦</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">No statements yet</h3>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Upload your bank statement CSV and our AI will analyze your financial health in seconds.
        </p>
        <a routerLink="/upload"
          class="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
          Upload your first statement →
        </a>
      </div>

      <!-- Dashboard with data -->
      <div *ngIf="!loading() && data()?.hasData">
        <!-- Score + stats row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
            <p class="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-1">Loan Readiness</p>
            <div class="text-5xl font-bold">{{ data()?.latestAnalysis?.loanReadinessScore?.overall ?? '--' }}</div>
            <p class="text-indigo-200 text-sm mt-1">out of 100</p>
            <div class="mt-4 bg-white/20 rounded-full h-2">
              <div class="bg-white rounded-full h-2 transition-all"
                [style.width.%]="data()?.latestAnalysis?.loanReadinessScore?.overall ?? 0"></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Statements Uploaded</p>
            <div class="text-3xl font-bold text-gray-900">{{ data()?.statementCount }}</div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Latest Income</p>
            <div class="text-2xl font-bold text-green-600">
              ₹{{ getLatestIncome() | number:'1.0-0' }}
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Savings Rate</p>
            <div class="text-2xl font-bold" [class]="getSavingsRateColor()">
              {{ getLatestSavingsRate() | number:'1.1-1' }}%
            </div>
          </div>
        </div>

        <!-- AI Insights -->
        <div *ngIf="data()?.latestAnalysis?.insights?.summary"
          class="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-6 flex gap-4">
          <div class="text-3xl flex-shrink-0">🧠</div>
          <div>
            <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">AI Financial Summary</p>
            <p class="text-gray-700 text-sm leading-relaxed">{{ data()?.latestAnalysis?.insights?.summary }}</p>
          </div>
        </div>

        <!-- Statements list -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-900">Your Statements</h3>
            <a routerLink="/upload"
              class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
              + Upload New
            </a>
          </div>
          <div class="divide-y divide-gray-50">
            <div *ngFor="let s of data()?.statements"
              class="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🏦</div>
                <div>
                  <p class="font-medium text-gray-900 text-sm">{{ s.bankName }}</p>
                  <p class="text-xs text-gray-500">
                    {{ s.periodFrom | date:'MMM yyyy' }} – {{ s.periodTo | date:'MMM yyyy' }} ·
                    {{ s.transactionCount }} transactions
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span [class]="s.status === 'analyzed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                  class="text-xs font-semibold px-2.5 py-1 rounded-full">
                  {{ s.status }}
                </span>
                <a *ngIf="s.status === 'analyzed'" [routerLink]="['/analysis', s.id]"
                  class="text-xs text-indigo-600 hover:underline font-medium">View Report →</a>
                <a *ngIf="s.status === 'analyzed'" [routerLink]="['/chat', s.id]"
                  class="text-xs text-purple-600 hover:underline font-medium">Chat →</a>
                <button *ngIf="s.status === 'parsed'" (click)="runAnalysis(s.id)"
                  class="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition">
                  Run AI Analysis
                </button>
                <button (click)="deleteStatement(s.id)"
                  class="text-xs text-gray-400 hover:text-red-500 transition">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<any>(null);

  constructor(
    private api: ApiService,
    public authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() { this.loadDashboard(); }

  loadDashboard() {
    this.loading.set(true);
    this.api.getDashboardSummary().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  runAnalysis(statementId: string) {
    this.api.runAnalysis(statementId).subscribe({
      next: () => this.router.navigate(['/analysis', statementId]),
    });
  }

  deleteStatement(id: string) {
    if (!confirm('Delete this statement and its analysis?')) return;
    this.api.deleteStatement(id).subscribe({ next: () => this.loadDashboard() });
  }

  getLatestIncome(): number {
    const months = this.data()?.latestAnalysis?.monthlyData ?? [];
    return months[months.length - 1]?.income ?? 0;
  }

  getLatestSavingsRate(): number {
    const months = this.data()?.latestAnalysis?.monthlyData ?? [];
    return months[months.length - 1]?.savingsRate ?? 0;
  }

  getSavingsRateColor(): string {
    const r = this.getLatestSavingsRate();
    if (r >= 20) return 'text-green-600';
    if (r >= 10) return 'text-amber-600';
    return 'text-red-500';
  }
}
