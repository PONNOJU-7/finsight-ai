import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Statement, StatementSchema } from '../statement/schemas/statement.schema';
import { Analysis, AnalysisSchema } from '../analysis/schemas/analysis.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Statement.name, schema: StatementSchema },
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
