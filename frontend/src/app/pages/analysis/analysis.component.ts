import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  template: `
    <div class="max-w-6xl mx-auto p-6 pt-10">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">AI Analysis Report</h1>
          <p class="text-gray-500 text-sm mt-1">Powered by Claude AI · Anthropic</p>
        </div>
        <a [routerLink]="['/chat', statementId]"
          class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
          🤖 Chat with AI Advisor
        </a>
      </div>

      <div *ngIf="loading()" class="flex flex-col items-center justify-center py-24">
        <div class="text-5xl animate-bounce mb-4">🧠</div>
        <p class="text-gray-600 font-medium">Claude AI is analyzing your finances...</p>
        <p class="text-gray-400 text-sm mt-1">This takes 5–10 seconds</p>
      </div>

      <div *ngIf="!loading() && analysis()">
        <!-- Loan Readiness Score -->
        <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white mb-6">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-indigo-200 text-sm font-medium mb-1">Loan Readiness Score</p>
              <div class="flex items-end gap-3">
                <span class="text-7xl font-bold">{{ analysis()?.loanReadinessScore?.overall }}</span>
                <span class="text-2xl text-indigo-200 mb-2">/100</span>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-2xl">{{ getScoreEmoji(analysis()?.loanReadinessScore?.overall) }}</span>
                <span class="text-indigo-100 font-medium">{{ getScoreLabel(analysis()?.loanReadinessScore?.overall) }}</span>
              </div>
            </div>
            <div class="text-right hidden md:block">
              <div *ngFor="let item of getScoreBreakdown()" class="flex items-center justify-end gap-3 mb-2">
                <span class="text-indigo-200 text-sm">{{ item.label }}</span>
                <div class="w-24 bg-indigo-800 rounded-full h-2">
                  <div class="bg-white rounded-full h-2 transition-all" [style.width.%]="item.pct"></div>
                </div>
                <span class="text-white text-sm font-semibold w-8">{{ item.score }}</span>
              </div>
            </div>
          </div>
          <div class="mt-6 bg-white/10 rounded-xl p-4">
            <p class="text-sm text-indigo-100">{{ analysis()?.loanReadinessScore?.explanation }}</p>
          </div>
          <div class="mt-3 bg-white/10 rounded-xl p-4">
            <p class="text-xs text-indigo-200 font-semibold uppercase tracking-wide mb-1">Recommendation</p>
            <p class="text-sm text-white">{{ analysis()?.loanReadinessScore?.recommendation }}</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Monthly Income vs Expense -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Income vs Expenses (Monthly)</h3>
            <canvas baseChart [data]="monthlyChartData" [options]="barChartOptions" type="bar" height="200"></canvas>
          </div>

          <!-- Spending Categories -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Spending Breakdown</h3>
            <canvas baseChart [data]="donutChartData" [options]="donutOptions" type="doughnut" height="200"></canvas>
          </div>
        </div>

        <!-- Insights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Key Observations</p>
            <ul class="space-y-2">
              <li *ngFor="let obs of analysis()?.insights?.keyObservations" class="flex gap-2 text-sm text-gray-700">
                <span class="text-blue-500 mt-0.5">•</span> {{ obs }}
              </li>
            </ul>
          </div>
          <div class="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
            <p class="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">✅ Strengths</p>
            <ul class="space-y-2">
              <li *ngFor="let p of analysis()?.insights?.positives" class="flex gap-2 text-sm text-gray-700">
                <span class="text-green-500 mt-0.5">✓</span> {{ p }}
              </li>
            </ul>
          </div>
          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">⚠️ Warnings</p>
            <ul class="space-y-2">
              <li *ngFor="let w of analysis()?.insights?.warnings" class="flex gap-2 text-sm text-gray-700">
                <span class="text-amber-500 mt-0.5">!</span> {{ w }}
              </li>
              <li *ngIf="!analysis()?.insights?.warnings?.length" class="text-sm text-gray-400">No warnings 🎉</li>
            </ul>
          </div>
        </div>

        <!-- Top Merchants & Category Table -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Top Merchants</h3>
            <div class="space-y-2">
              <div *ngFor="let m of analysis()?.topMerchants; let i = index"
                   class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{{ i+1 }}</span>
                <span class="text-sm text-gray-700">{{ m }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Spending Categories</h3>
            <div class="space-y-3">
              <div *ngFor="let cat of analysis()?.spendingCategories?.slice(0,6)">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-700">{{ cat.category }}</span>
                  <span class="font-semibold text-gray-900">₹{{ cat.amount | number:'1.0-0' }}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5">
                  <div class="bg-indigo-500 rounded-full h-1.5" [style.width.%]="cat.percentage"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AnalysisComponent implements OnInit {
  statementId = '';
  loading = signal(true);
  analysis = signal<any>(null);

  monthlyChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  donutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };
  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
  };

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.statementId = this.route.snapshot.paramMap.get('statementId') ?? '';
    this.loadAnalysis();
  }

  loadAnalysis() {
    this.api.getAnalysis(this.statementId).subscribe({
      next: (data) => { this.setAnalysis(data); this.loading.set(false); },
      error: () => {
        // Try running analysis if not found
        this.api.runAnalysis(this.statementId).subscribe({
          next: (data) => { this.setAnalysis(data); this.loading.set(false); },
          error: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
        });
      },
    });
  }

  setAnalysis(data: any) {
    this.analysis.set(data);
    this.buildCharts(data);
  }

  buildCharts(data: any) {
    // Monthly bar chart
    const months = data.monthlyData ?? [];
    this.monthlyChartData = {
      labels: months.map((m: any) => m.month),
      datasets: [
        { label: 'Income', data: months.map((m: any) => m.income), backgroundColor: '#6366f1' },
        { label: 'Expenses', data: months.map((m: any) => m.expenses), backgroundColor: '#f43f5e' },
      ],
    };

    // Donut chart
    const cats = (data.spendingCategories ?? []).filter((c: any) => c.amount > 0);
    const colors = ['#6366f1','#f43f5e','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#64748b'];
    this.donutChartData = {
      labels: cats.map((c: any) => c.category),
      datasets: [{ data: cats.map((c: any) => c.amount), backgroundColor: colors }],
    };
  }

  getScoreBreakdown() {
    const lr = this.analysis()?.loanReadinessScore;
    if (!lr) return [];
    return [
      { label: 'Income Regularity', score: lr.incomeRegularity, pct: (lr.incomeRegularity / 20) * 100 },
      { label: 'Avg Balance', score: lr.averageBalance, pct: (lr.averageBalance / 20) * 100 },
      { label: 'Obligation Ratio', score: lr.obligationToIncomeRatio, pct: (lr.obligationToIncomeRatio / 20) * 100 },
      { label: 'Spending Stability', score: lr.spendingVolatility, pct: (lr.spendingVolatility / 20) * 100 },
      { label: 'Savings Rate', score: lr.savingsRate, pct: (lr.savingsRate / 10) * 100 },
    ];
  }

  getScoreEmoji(score: number): string {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent — High loan eligibility';
    if (score >= 60) return 'Good — Likely eligible for most loans';
    if (score >= 40) return 'Fair — May qualify with conditions';
    return 'Needs improvement — Work on savings & stability';
  }
}
