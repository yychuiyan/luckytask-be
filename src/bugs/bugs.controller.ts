import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsEnum, IsInt, MinLength, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BugsService } from './bugs.service';
import { BugStatus, BugSeverity } from './bug.entity';

export class CreateBugDto {
  @IsInt()
  projectId: number;

  @IsOptional()
  @IsInt()
  iterationId?: number;

  @IsOptional()
  @IsInt()
  requirementId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsEnum(BugSeverity)
  severity?: BugSeverity;

  @IsOptional()
  @IsEnum(BugStatus)
  status?: BugStatus;

  @IsOptional()
  @IsString()
  reproduceSteps?: string;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsString()
  actualResult?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  environment?: string;

  @IsOptional()
  @IsString()
  githubIssue?: string;

  @IsOptional()
  @IsString()
  attachment?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateBugDto {
  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsInt()
  iterationId?: number;

  @IsOptional()
  @IsInt()
  requirementId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(BugSeverity)
  severity?: BugSeverity;

  @IsOptional()
  @IsEnum(BugStatus)
  status?: BugStatus;

  @IsOptional()
  @IsString()
  reproduceSteps?: string;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsString()
  actualResult?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  environment?: string;

  @IsOptional()
  @IsString()
  githubIssue?: string;

  @IsOptional()
  @IsString()
  attachment?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

@Controller('api/v1/bugs')
@UseGuards(JwtAuthGuard)
export class BugsController {
  constructor(private readonly service: BugsService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('projectId') projectId?: number,
    @Query('iterationId') iterationId?: number,
    @Query('status') status?: BugStatus,
    @Query('severity') severity?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll(req.user.id, { projectId, iterationId, status, severity, page: page ? +page : undefined, pageSize: pageSize ? +pageSize : undefined });
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: number) {
    return this.service.findOne(req.user.id, id);
  }

  @Post()
  create(@Req() req, @Body() dto: CreateBugDto) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: number, @Body() dto: UpdateBugDto) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: number) {
    return this.service.remove(req.user.id, id);
  }
}
