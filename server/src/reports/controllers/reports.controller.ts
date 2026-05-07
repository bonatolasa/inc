import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ReportsService } from '../services/reports.service';
import { Role } from 'src/enums/role.enum';
import { authorize } from 'src/auth/decorators/authorize.decorator';
import { Permissions } from 'src/auth/constants/permissions.constants';
import {
  DashboardStatsResponseDto,
  ProjectPerformanceResponseDto,
  StatusDistributionResponseDto,
  TeamPerformanceResponseDto,
  UserPerformanceResponseDto,
} from '../responses/report.response';

class TimeTrackingQueryDto {
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;
}
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('dashboard')
  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const stats = await this.reportsService.getDashboardStats();
    return {
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully',
    };
  }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('manager-dashboard')
  async getManagerDashboardStats(
    @CurrentUser() user: { id: string },
  ): Promise<DashboardStatsResponseDto> {
    const stats = await this.reportsService.getManagerStats(user.id);
    return {
      success: true,
      data: stats,
      message: 'Manager dashboard stats retrieved successfully',
    };
  }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('project-performance/:projectId')
  async getProjectPerformance(
    @Param('projectId') projectId: string,
  ): Promise<ProjectPerformanceResponseDto> {
    const performance =
      await this.reportsService.getProjectPerformance(projectId);
    return {
      success: true,
      data: performance,
      message: 'Project performance retrieved successfully',
    };
  }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('user-performance/:userId')
  async getUserPerformance(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; roles?: string[] },
  ): Promise<UserPerformanceResponseDto> {
    const userRoles = user.roles || [];
    if (userRoles.includes('team_member') && user.id !== userId) {
      throw new ForbiddenException('You can only view your own performance');
    }
    const performance = await this.reportsService.getUserPerformance(userId);
    return {
      success: true,
      data: performance,
      message: 'User performance retrieved successfully',
    };
  }
  @authorize(Permissions.REPORTS_VIEW)
  @Get('team-performance/:teamId')
  async getTeamPerformance(
    @Param('teamId') teamId: string,
  ): Promise<TeamPerformanceResponseDto> {
    const performance = await this.reportsService.getTeamPerformance(teamId);
    return {
      success: true,
      data: performance,
      message: 'Team performance retrieved successfully',
    };
  }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('team-workload/:teamId')
  async getTeamWorkload(@Param('teamId') teamId: string): Promise<any> {
    const workload = await this.reportsService.getTeamWorkload(teamId);
    return {
      success: true,
      data: workload,
      message: 'Team workload retrieved successfully',
    };
  }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('task-status-distribution')
  async getTaskStatusDistribution(): Promise<StatusDistributionResponseDto> {
    const distribution = await this.reportsService.getTaskStatusDistribution();
    return {
      success: true,
      data: distribution,
      message: 'Task status distribution retrieved successfully',
    };
  }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('project-status-distribution')
  async getProjectStatusDistribution(): Promise<StatusDistributionResponseDto> {
    const distribution =
      await this.reportsService.getProjectStatusDistribution();
    return {
      success: true,
      data: distribution,
      message: 'Project status distribution retrieved successfully',
    };
  }

  @authorize(Permissions.REPORTS_VIEW)
  @Get('time-tracking')
  async getTimeTrackingReport(
    @Query() query: TimeTrackingQueryDto,
  ): Promise<any> {
    const startDate =
      query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = query.endDate || new Date();

    const report = await this.reportsService.getTimeTrackingReport(
      startDate,
      endDate,
    );
    return {
      success: true,
      data: report,
      message: 'Time tracking report retrieved successfully',
    };
  }
}
