import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalysisDocument = Analysis & Document;

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyData {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export interface LoanReadinessScore {
  overall: number; // 0-100
  incomeRegularity: number;
  averageBalance: number;
  obligationToIncomeRatio: number;
  spendingVolatility: number;
  bounceRate: number;
  savingsRate: number;
  explanation: string;
  recommendation: string;
}

@Schema({ timestamps: true })
export class Analysis {
  @Prop({ type: Types.ObjectId, ref: 'Statement', required: true, unique: true })
  statementId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  spendingCategories: SpendingCategory[];

  @Prop({ type: [Object], default: [] })
  monthlyData: MonthlyData[];

  @Prop({ type: Object })
  loanReadinessScore: LoanReadinessScore;

  @Prop({ type: [String], default: [] })
  topMerchants: string[];

  @Prop({ type: Object, default: {} })
  insights: {
    summary: string;
    keyObservations: string[];
    warnings: string[];
    positives: string[];
  };

  @Prop({ default: 'completed', enum: ['running', 'completed', 'failed'] })
  status: string;

  @Prop()
  error?: string;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
AnalysisSchema.index({ statementId: 1 });
AnalysisSchema.index({ userId: 1 });
