import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteContentBlock } from './entities/site-content-block.entity';
import { SiteContentService } from './site-content.service';
import { SiteContentController } from './site-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContentBlock])],
  providers: [SiteContentService],
  controllers: [SiteContentController],
  exports: [SiteContentService],
})
export class SiteContentModule {}
