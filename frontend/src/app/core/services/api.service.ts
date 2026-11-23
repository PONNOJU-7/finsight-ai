import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Statements
  uploadStatement(formData: FormData) {
    return this.http.post<any>(`${this.base}/statement/upload`, formData);
  }
  getStatements() {
    return this.http.get<any[]>(`${this.base}/statement`);
  }
  getStatement(id: string) {
    return this.http.get<any>(`${this.base}/statement/${id}`);
  }
  deleteStatement(id: string) {
    return this.http.delete<any>(`${this.base}/statement/${id}`);
  }

  // Analysis
  runAnalysis(statementId: string) {
    return this.http.post<any>(`${this.base}/analysis/run/${statementId}`, {});
  }
  getAnalysis(statementId: string) {
    return this.http.get<any>(`${this.base}/analysis/${statementId}`);
  }

  // Chat
  sendMessage(statementId: string, message: string) {
    return this.http.post<{ message: string; conversationId: string }>(
      `${this.base}/chat/message`, { statementId, message },
    );
  }
  getChatHistory(statementId: string) {
    return this.http.get<any>(`${this.base}/chat/history?statementId=${statementId}`);
  }
  clearChatHistory(statementId: string) {
    return this.http.delete<any>(`${this.base}/chat/history?statementId=${statementId}`);
  }

  // Dashboard
  getDashboardSummary() {
    return this.http.get<any>(`${this.base}/dashboard/summary`);
  }
}
