import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Statement, StatementDocument } from './schemas/statement.schema';
import { parseBankStatementCsv } from './csv.parser';

@Injectable()
export class StatementService {
  constructor(
    @InjectModel(Statement.name) private statementModel: Model<StatementDocument>,
  ) {}

  async upload(
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
    bankName: string,
    accountHolder: string,
  ) {
    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are supported');
    }

    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const duplicate = await this.statementModel
      .findOne({ userId: new Types.ObjectId(userId), checksum })
      .lean();
    if (duplicate) throw new ConflictException('This statement has already been uploaded');

    let parsed;
    try {
      parsed = parseBankStatementCsv(file.buffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV parse failed';
      throw new BadRequestException(msg);
    }

    const statement = await this.statementModel.create({
      userId: new Types.ObjectId(userId),
      fileName: file.originalname,
      bankName: bankName ?? 'Unknown Bank',
      accountHolder: accountHolder ?? 'Unknown',
      transactions: parsed.transactions,
      totalCredits: parsed.totalCredits,
      totalDebits: parsed.totalDebits,
      periodFrom: parsed.periodFrom,
      periodTo: parsed.periodTo,
      transactionCount: parsed.transactions.length,
      status: 'parsed',
      checksum,
    });

    return {
      id: statement._id,
      fileName: statement.fileName,
      transactionCount: statement.transactionCount,
      totalCredits: statement.totalCredits,
      totalDebits: statement.totalDebits,
      periodFrom: statement.periodFrom,
      periodTo: statement.periodTo,
      status: statement.status,
    };
  }

  async findByUser(userId: string) {
    return this.statementModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('-transactions')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(userId: string, statementId: string) {
    const statement = await this.statementModel
      .findOne({ _id: statementId, userId: new Types.ObjectId(userId) })
      .lean();
    if (!statement) throw new NotFoundException('Statement not found');
    return statement;
  }

  async delete(userId: string, statementId: string) {
    const result = await this.statementModel.deleteOne({
      _id: statementId,
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Statement not found');
    return { deleted: true };
  }
}
