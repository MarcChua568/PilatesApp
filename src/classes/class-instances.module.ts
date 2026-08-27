import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassInstance } from './entities/class-instance.entity';
import { ClassInstancesService } from './class-instances.service';
import { ClassInstancesController } from './class-instances.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassInstance])],
  providers: [ClassInstancesService],
  controllers: [ClassInstancesController],
  exports: [ClassInstancesService],
})
export class ClassInstancesModule {}
