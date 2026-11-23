import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StatementDocument = Statement & Document;

export interface Transaction {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category?: string;
  merchant?: string;
}

@Schema({ timestamps: true })
export class Statement {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  accountHolder: string;

  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  periodFrom: Date;

  @Prop({ required: true })
  periodTo: Date;

  @Prop({ type: [Object], default: [] })
  transactions: Transaction[];

  @Prop({ default: 0 })
  totalCredits: number;

  @Prop({ default: 0 })
  totalDebits: number;

  @Prop({ default: 0 })
  transactionCount: number;

  @Prop({ default: 'pending', enum: ['pending', 'parsed', 'analyzed'] })
  status: string;

  @Prop()
  checksum: string;
}

export const StatementSchema = SchemaFactory.createForClass(Statement);
StatementSchema.index({ userId: 1, createdAt: -1 });
