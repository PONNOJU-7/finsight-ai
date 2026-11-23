import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6 pt-10">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Upload Bank Statement</h1>
        <p class="text-gray-500 mt-1 text-sm">Upload a CSV bank statement. Our AI will analyze it instantly.</p>
      </div>

      <!-- Drop zone -->
      <div class="border-2 border-dashed rounded-2xl p-10 text-center transition-colors"
        [class]="dragging() ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400'"
        (dragover)="onDragOver($event)" (dragleave)="dragging.set(false)" (drop)="onDrop($event)">
        <div *ngIf="!selectedFile()">
          <div class="text-4xl mb-4">📄</div>
          <p class="text-gray-600 font-medium">Drag & drop your CSV statement here</p>
          <p class="text-gray-400 text-sm mt-1">or</p>
          <label class="mt-3 inline-block cursor-pointer bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
            Browse file
            <input type="file" accept=".csv" class="hidden" (change)="onFileSelect($event)" />
          </label>
          <p class="text-xs text-gray-400 mt-3">Supports CSV format · Max 10MB</p>
        </div>

        <div *ngIf="selectedFile()" class="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📊</span>
            <div class="text-left">
              <p class="text-sm font-semibold text-gray-900">{{ selectedFile()?.name }}</p>
              <p class="text-xs text-gray-500">{{ formatSize(selectedFile()?.size ?? 0) }}</p>
            </div>
          </div>
          <button (click)="selectedFile.set(null)" class="text-gray-400 hover:text-red-500 transition text-lg">✕</button>
        </div>
      </div>

      <!-- Metadata form -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6 space-y-4">
        <h3 class="font-semibold text-gray-800">Statement Details</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input [(ngModel)]="bankName" placeholder="e.g. HDFC Bank, SBI, ICICI"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
          <input [(ngModel)]="accountHolder" placeholder="Name as on bank statement"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
        </div>
      </div>

      <p *ngIf="error()" class="mt-4 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-100">{{ error() }}</p>

      <button (click)="upload()"
        [disabled]="!selectedFile() || loading() || !bankName || !accountHolder"
        class="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        <span *ngIf="loading()" class="animate-spin">⟳</span>
        {{ loading() ? 'Uploading & parsing...' : '🚀 Upload & Analyze' }}
      </button>

      <!-- CSV format hint -->
      <div class="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-sm font-semibold text-amber-800 mb-2">📋 Expected CSV format</p>
        <code class="text-xs text-amber-700 block">Date, Description, Debit, Credit, Balance</code>
        <code class="text-xs text-amber-700 block">01/06/2025, SWIGGY ORDER, 450.00, , 24550.00</code>
        <code class="text-xs text-amber-700 block">02/06/2025, SALARY CREDIT, , 85000.00, 109550.00</code>
      </div>
    </div>
  `,
})
export class UploadComponent {
  selectedFile = signal<File | null>(null);
  dragging = signal(false);
  loading = signal(false);
  error = signal('');
  bankName = '';
  accountHolder = '';

  constructor(private api: ApiService, private router: Router) {}

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File) {
    if (!file.name.endsWith('.csv')) { this.error.set('Only CSV files are supported'); return; }
    this.selectedFile.set(file);
    this.error.set('');
  }

  upload() {
    const file = this.selectedFile();
    if (!file) return;
    this.loading.set(true);
    this.error.set('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('bankName', this.bankName);
    fd.append('accountHolder', this.accountHolder);

    this.api.uploadStatement(fd).subscribe({
      next: (res) => {
        // Auto-run analysis then navigate
        this.api.runAnalysis(res.id).subscribe({
          next: () => this.router.navigate(['/analysis', res.id]),
          error: () => this.router.navigate(['/dashboard']),
        });
      },
      error: (err) => {
        this.error.set(err.error?.message?.error ?? err.error?.message ?? 'Upload failed');
        this.loading.set(false);
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
