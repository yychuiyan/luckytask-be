import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsEnum, IsInt, IsArray, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirementsService } from './requirements.service';
import { RequirementStatus, RequirementPriority } from './requirement.entity';

class AcceptanceCriteriaItem {
  @IsString()
  text: string;

  @IsOptional()
  done: boolean = false;
}

export class CreateRequirementDto {
  @IsInt()
  projectId: number;

  @IsOptional()
  @IsInt()
  iterationId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsEnum(RequirementPriority)
  priority?: RequirementPriority;

  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptanceCriteriaItem)
  acceptanceCriteria?: AcceptanceCriteriaItem[];

  @IsOptional()
  @IsString()
  githubIssue?: string;
}

export class UpdateRequirementDto {
  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsInt()
  iterationId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(RequirementPriority)
  priority?: RequirementPriority;

  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptanceCriteriaItem)
  acceptanceCriteria?: AcceptanceCriteriaItem[];

  @IsOptional()
  @IsString()
  githubIssue?: string;
}

@Controller('api/v1/requirements')
@UseGuards(JwtAuthGuard)
export class RequirementsController {
  constructor(private readonly service: RequirementsService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('projectId') projectId?: number,
    @Query('iterationId') iterationId?: number,
    @Query('status') status?: RequirementStatus,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll(req.user.id, { projectId, iterationId, status, priority, page: page ? +page : undefined, pageSize: pageSize ? +pageSize : undefined });
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: number) {
    return this.service.findOne(req.user.id, id);
  }

  @Post()
  create(@Req() req, @Body() dto: CreateRequirementDto) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: number, @Body() dto: UpdateRequirementDto) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: number) {
    return this.service.remove(req.user.id, id);
  }
}
