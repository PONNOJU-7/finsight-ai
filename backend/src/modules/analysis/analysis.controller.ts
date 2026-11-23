import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalysisService } from './analysis.service';

@ApiTags('Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post('run/:statementId')
  @ApiOperation({ summary: 'Run AI analysis on a statement (Claude AI)' })
  run(
    @CurrentUser() user: { _id: string },
    @Param('statementId') statementId: string,
  ) {
    return this.analysisService.runAnalysis(user._id, statementId);
  }

  @Get(':statementId')
  @ApiOperation({ summary: 'Get analysis results for a statement' })
  get(
    @CurrentUser() user: { _id: string },
    @Param('statementId') statementId: string,
  ) {
    return this.analysisService.getAnalysis(user._id, statementId);
  }
}
