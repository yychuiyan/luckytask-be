import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repo } from './repo.entity';
import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Repo])],
  controllers: [ReposController],
  providers: [ReposService],
})
export class ReposModule {}
