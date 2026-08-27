import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassInstance } from './entities/class-instance.entity';
import { ClassInstancesService } from './class-instances.service';
import { ClassInstancesController } from './class-instances.controller';
import { GenerationService } from './generation.service';
import { ClassTemplatesModule } from './class-templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassInstance]),
    ClassTemplatesModule,
  ],
  providers: [ClassInstancesService, GenerationService],
  controllers: [ClassInstancesController],
  exports: [ClassInstancesService],
})
export class ClassInstancesModule {}
