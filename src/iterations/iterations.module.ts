import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Iteration } from './iteration.entity';
import { IterationsController } from './iterations.controller';
import { IterationsService } from './iterations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Iteration])],
  controllers: [IterationsController],
  providers: [IterationsService],
  exports: [IterationsService],
})
export class IterationsModule {}
