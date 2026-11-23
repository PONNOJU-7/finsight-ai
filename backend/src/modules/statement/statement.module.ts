import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatementController } from './statement.controller';
import { StatementService } from './statement.service';
import { Statement, StatementSchema } from './schemas/statement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Statement.name, schema: StatementSchema }]),
  ],
  controllers: [StatementController],
  providers: [StatementService],
  exports: [StatementService, MongooseModule],
})
export class StatementModule {}