import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassTemplate } from './entities/class-template.entity';
import { ClassTemplatesService } from './class-templates.service';
import { ClassTemplatesController } from './class-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassTemplate])],
  providers: [ClassTemplatesService],
  controllers: [ClassTemplatesController],
  exports: [ClassTemplatesService],
})
export class ClassTemplatesModule {}
