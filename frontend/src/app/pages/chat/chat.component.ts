import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: Date; }

const SUGGESTED = [
  'Can I afford a ₹5 lakh loan with ₹8,000 monthly EMI?',
  'Where am I spending the most unnecessarily?',
  'What should I do to improve my loan eligibility score?',
  'How does my savings rate compare to recommended levels?',
  'What is my biggest financial risk right now?',
];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-[calc(100vh-64px)]">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">AI</div>
        <div>
          <p class="font-semibold text-gray-900">FinSight AI Advisor</p>
          <p class="text-xs text-green-500 font-medium">● Powered by Claude · Your data is private</p>
        </div>
      </div>

      <!-- Messages -->
      <div #messageContainer class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        <!-- Welcome -->
        <div *ngIf="messages().length === 0" class="text-center py-12">
          <div class="text-5xl mb-4">🤖</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Your AI Financial Advisor</h3>
          <p class="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Ask me anything about your finances. I have full context of your bank statement analysis.
          </p>
          <div class="grid grid-cols-1 gap-2 max-w-lg mx-auto">
            <button *ngFor="let s of suggestions" (click)="sendSuggestion(s)"
              class="text-left text-sm bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 px-4 py-3 rounded-xl transition text-gray-700">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div *ngFor="let msg of messages()" class="flex" [class.justify-end]="msg.role === 'user'">
          <div class="max-w-[75%]">
            <div class="flex items-end gap-2" [class.flex-row-reverse]="msg.role === 'user'">
              <div *ngIf="msg.role === 'assistant'"
                class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
              <div [class]="msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-3'
                : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm'">
                <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-1" [class.text-right]="msg.role === 'user'">
              {{ msg.timestamp | date:'shortTime' }}
            </p>
          </div>
        </div>

        <!-- Typing indicator -->
        <div *ngIf="typing()" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">AI</div>
          <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
            <div class="flex gap-1 items-center h-4">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="bg-white border-t border-gray-200 p-4">
        <div class="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea [(ngModel)]="input" (keydown.enter)="onEnter($event)"
            placeholder="Ask anything about your finances..."
            rows="1"
            class="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
            style="max-height:120px"></textarea>
          <button (click)="send()" [disabled]="!input.trim() || typing()"
            class="bg-indigo-600 text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p class="text-center text-xs text-gray-400 mt-2">Your financial data stays private · Never stored by AI</p>
      </div>
    </div>
  `,
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef;

  statementId = '';
  messages = signal<ChatMessage[]>([]);
  input = '';
  typing = signal(false);
  suggestions = SUGGESTED;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.statementId = this.route.snapshot.paramMap.get('statementId') ?? '';
    this.loadHistory();
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  loadHistory() {
    this.api.getChatHistory(this.statementId).subscribe({
      next: (res) => this.messages.set(res.messages ?? []),
    });
  }

  onEnter(e: Event) {
    const ev = e as KeyboardEvent;
    if (!ev.shiftKey) { ev.preventDefault(); this.send(); }
  }

  sendSuggestion(text: string) { this.input = text; this.send(); }

  send() {
    const text = this.input.trim();
    if (!text || this.typing()) return;

    this.messages.update(m => [...m, { role: 'user', content: text, timestamp: new Date() }]);
    this.input = '';
    this.typing.set(true);

    this.api.sendMessage(this.statementId, text).subscribe({
      next: (res) => {
        this.messages.update(m => [...m, { role: 'assistant', content: res.message, timestamp: new Date() }]);
        this.typing.set(false);
      },
      error: () => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        }]);
        this.typing.set(false);
      },
    });
  }

  private scrollToBottom() {
    try {
      const el = this.messageContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
