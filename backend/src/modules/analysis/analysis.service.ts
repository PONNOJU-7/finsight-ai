import {
  Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { isMockAiEnabled } from '../../common/ai/ai-mode';
import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
import { Statement, StatementDocument, Transaction } from '../statement/schemas/statement.schema';
import { buildMockAnalysis } from './mock-analysis';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly mockAi: boolean;
  private readonly claude: Anthropic | null;

  constructor(
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
    @InjectModel(Statement.name) private statementModel: Model<StatementDocument>,
    config: ConfigService,
  ) {
    this.mockAi = isMockAiEnabled(config);
    if (this.mockAi) {
      this.claude = null;
      this.logger.warn('AI_PROVIDER=mock (or MOCK_CLAUDE=true) — analysis uses local heuristics, not Anthropic');
    } else {
      const apiKey = config.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required unless AI_PROVIDER=mock or MOCK_CLAUDE=true');
      }
      this.claude = new Anthropic({ apiKey });
    }
  }

  async runAnalysis(userId: string, statementId: string) {
    const statement = await this.statementModel
      .findOne({ _id: statementId, userId: new Types.ObjectId(userId) })
      .lean();
    if (!statement) throw new NotFoundException('Statement not found');
    if (statement.transactions.length === 0) {
      throw new BadRequestException('Statement has no transactions to analyze');
    }

    // Upsert analysis with running status
    await this.analysisModel.findOneAndUpdate(
      { statementId: new Types.ObjectId(statementId) },
      {
        $set: {
          statementId: new Types.ObjectId(statementId),
          userId: new Types.ObjectId(userId),
          status: 'running',
        },
      },
      { upsert: true, new: true },
    );

    try {
      const result = await this.performAiAnalysis(statement.transactions);

      const updated = await this.analysisModel.findOneAndUpdate(
        { statementId: new Types.ObjectId(statementId) },
        { $set: { ...result, status: 'completed' } },
        { new: true },
      );

      // Mark statement as analyzed
      await this.statementModel.updateOne(
        { _id: statementId },
        { $set: { status: 'analyzed' } },
      );

      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      await this.analysisModel.updateOne(
        { statementId: new Types.ObjectId(statementId) },
        { $set: { status: 'failed', error: msg } },
      );
      throw new InternalServerErrorException(`AI analysis failed: ${msg}`);
    }
  }

  async getAnalysis(userId: string, statementId: string) {
    const analysis = await this.analysisModel
      .findOne({
        statementId: new Types.ObjectId(statementId),
        userId: new Types.ObjectId(userId),
      })
      .lean();
    if (!analysis) throw new NotFoundException('Analysis not found. Run /analysis/run/:statementId first.');
    return analysis;
  }

  private async performAiAnalysis(transactions: Transaction[]) {
    if (this.mockAi) {
      await new Promise(r => setTimeout(r, 400));
      return buildMockAnalysis(transactions);
    }

    // Build transaction summary for the prompt (keep token count manageable)
    const txSample = transactions.slice(0, 200).map(t =>
      `${t.date.toString().slice(0, 10)} | ${t.description.slice(0, 50)} | DR: ${t.debit} | CR: ${t.credit} | BAL: ${t.balance}`,
    ).join('\n');

    const totalCredits = transactions.reduce((s, t) => s + t.credit, 0);
    const totalDebits = transactions.reduce((s, t) => s + t.debit, 0);

    const prompt = `
You are an expert bank statement analyzer and financial advisor. Analyze the following bank transactions and return a comprehensive JSON analysis.

TRANSACTIONS (${transactions.length} total, showing up to 200):
${txSample}

TOTALS: Total Credits: ${totalCredits.toFixed(2)}, Total Debits: ${totalDebits.toFixed(2)}

Return ONLY valid JSON in this exact structure (no markdown, no explanation, just JSON):
{
  "spendingCategories": [
    { "category": "Food & Dining", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "Rent & Housing", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "EMI & Loans", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "Utilities & Bills", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "Entertainment", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "Shopping", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "Travel & Transport", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "Healthcare", "amount": 0, "percentage": 0, "transactionCount": 0 },
    { "category": "Transfers & Misc", "amount": 0, "percentage": 0, "transactionCount": 0 }
  ],
  "monthlyData": [
    { "month": "YYYY-MM", "income": 0, "expenses": 0, "savings": 0, "savingsRate": 0 }
  ],
  "loanReadinessScore": {
    "overall": 0,
    "incomeRegularity": 0,
    "averageBalance": 0,
    "obligationToIncomeRatio": 0,
    "spendingVolatility": 0,
    "bounceRate": 0,
    "savingsRate": 0,
    "explanation": "Brief explanation of the score",
    "recommendation": "Specific actionable recommendation to improve the score"
  },
  "topMerchants": ["merchant1", "merchant2", "merchant3", "merchant4", "merchant5"],
  "insights": {
    "summary": "2-3 sentence overall financial health summary",
    "keyObservations": ["observation 1", "observation 2", "observation 3"],
    "warnings": ["warning if any — e.g. high EMI-to-income ratio"],
    "positives": ["positive 1 — e.g. consistent salary credits"]
  }
}

Guidelines for Loan Readiness Score (0-100):
- incomeRegularity (0-20): Regular monthly salary/business credits = higher score
- averageBalance (0-20): Higher average balance relative to income = higher score
- obligationToIncomeRatio (0-20): Lower EMI/loan payments relative to income = higher score (below 40% is good)
- spendingVolatility (0-20): Consistent monthly spending = higher score
- bounceRate (0-10): No returned/bounced transactions = 10, each bounce reduces score
- savingsRate (0-10): Higher savings rate = higher score (above 20% is excellent)
`.trim();

    const response = await this.claude!.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected Claude response type');

    try {
      return JSON.parse(content.text);
    } catch {
      // Try to extract JSON from response
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Claude returned invalid JSON');
    }
  }

  async getAnalysisSummaryForChat(userId: string, statementId: string): Promise<string> {
    const analysis = await this.analysisModel
      .findOne({ statementId: new Types.ObjectId(statementId), userId: new Types.ObjectId(userId) })
      .lean();
    if (!analysis) return 'No analysis available yet.';

    const { loanReadinessScore: lr, insights, spendingCategories, monthlyData } = analysis;
    const topCategories = spendingCategories
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(c => `${c.category}: ₹${c.amount.toFixed(0)} (${c.percentage.toFixed(1)}%)`)
      .join(', ');

    const latestMonth = monthlyData[monthlyData.length - 1];

    return `
FINANCIAL SUMMARY:
- Loan Readiness Score: ${lr?.overall ?? 'N/A'}/100
- Latest Month Income: ₹${latestMonth?.income?.toFixed(0) ?? 'N/A'}
- Latest Month Expenses: ₹${latestMonth?.expenses?.toFixed(0) ?? 'N/A'}
- Savings Rate: ${latestMonth?.savingsRate?.toFixed(1) ?? 'N/A'}%
- Top Spending: ${topCategories}
- AI Summary: ${insights?.summary ?? ''}
- Key Observations: ${insights?.keyObservations?.join('; ') ?? ''}
- Warnings: ${insights?.warnings?.join('; ') ?? 'None'}
    `.trim();
  }
}
