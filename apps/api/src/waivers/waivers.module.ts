import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaiverSubmission } from './entities/waiver-submission.entity';
import { WaiversService } from './waivers.service';
import { WaiversController } from './waivers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WaiverSubmission])],
  providers: [WaiversService],
  controllers: [WaiversController],
  exports: [WaiversService],
})
export class WaiversModule {}
