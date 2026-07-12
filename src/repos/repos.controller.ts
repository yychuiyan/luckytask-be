import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReposService } from './repos.service';

export class CreateRepoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  owner: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  repo: string;

  @IsOptional()
  @IsInt()
  projectId?: number;
}

export class UpdateRepoDto {
  @IsOptional()
  @IsInt()
  projectId?: number | null;
}

@Controller('api/v1/repos')
@UseGuards(JwtAuthGuard)
export class ReposController {
  constructor(private readonly service: ReposService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll(
      req.user.id,
      page ? +page : 1,
      pageSize ? +pageSize : 10,
    );
  }

  @Post()
  create(@Req() req, @Body() dto: CreateRepoDto) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: number, @Body() dto: UpdateRepoDto) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: number) {
    return this.service.remove(req.user.id, id);
  }

  @Get('contributions')
  getContributions(@Query('owner') owner: string) {
    if (!owner) return null;
    return this.service.getContributions(owner);
  }
}
