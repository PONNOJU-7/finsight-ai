import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Statement, StatementDocument } from '../statement/schemas/statement.schema';
import { Analysis, AnalysisDocument } from '../analysis/schemas/analysis.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Statement.name) private statementModel: Model<StatementDocument>,
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
  ) {}

  async getSummary(userId: string) {
    const statements = await this.statementModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('-transactions')
      .sort({ createdAt: -1 })
      .lean();

    if (statements.length === 0) {
      return { statements: [], latestAnalysis: null, hasData: false };
    }

    const latestAnalyzed = statements.find(s => s.status === 'analyzed');
    let latestAnalysis = null;

    if (latestAnalyzed) {
      latestAnalysis = await this.analysisModel
        .findOne({ statementId: latestAnalyzed._id })
        .lean();
    }

    return {
      hasData: true,
      statementCount: statements.length,
      statements: statements.map(s => ({
        id: s._id,
        fileName: s.fileName,
        bankName: s.bankName,
        periodFrom: s.periodFrom,
        periodTo: s.periodTo,
        totalCredits: s.totalCredits,
        totalDebits: s.totalDebits,
        transactionCount: s.transactionCount,
        status: s.status,
        createdAt: s['createdAt'],
      })),
      latestAnalysis: latestAnalysis
        ? {
            statementId: latestAnalysis.statementId,
            loanReadinessScore: latestAnalysis.loanReadinessScore,
            spendingCategories: latestAnalysis.spendingCategories,
            monthlyData: latestAnalysis.monthlyData,
            topMerchants: latestAnalysis.topMerchants,
            insights: latestAnalysis.insights,
          }
        : null,
    };
  }

  async getStatementDashboard(userId: string, statementId: string) {
    const statement = await this.statementModel
      .findOne({ _id: statementId, userId: new Types.ObjectId(userId) })
      .lean();
    if (!statement) throw new NotFoundException('Statement not found');

    const analysis = await this.analysisModel
      .findOne({ statementId: new Types.ObjectId(statementId) })
      .lean();

    return { statement, analysis };
  }
}
