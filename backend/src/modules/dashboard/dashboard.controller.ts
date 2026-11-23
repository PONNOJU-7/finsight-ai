import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get overall dashboard — latest analysis + all statements' })
  getSummary(@CurrentUser() user: { _id: string }) {
    return this.dashboardService.getSummary(user._id);
  }

  @Get(':statementId')
  @ApiOperation({ summary: 'Get full dashboard for a specific statement' })
  getStatementDashboard(
    @CurrentUser() user: { _id: string },
    @Param('statementId') statementId: string,
  ) {
    return this.dashboardService.getStatementDashboard(user._id, statementId);
  }
}
