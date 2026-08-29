import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { SiteContentService } from './site-content.service';
import { UpsertSiteContentDto } from './dto/upsert-site-content.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('site-content')
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @RequirePermission('site-content')
  @Patch(':key')
  upsert(@Param('key') key: string, @Body() dto: UpsertSiteContentDto) {
    return this.service.upsert(key, dto.data);
  }
}
