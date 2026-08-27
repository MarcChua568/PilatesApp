import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClassInstancesService } from './class-instances.service';
import { GenerationService } from './generation.service';
import { CreateClassInstanceDto } from './dto/create-class-instance.dto';
import { UpdateClassInstanceDto } from './dto/update-class-instance.dto';
import { ListClassInstancesDto } from './dto/list-class-instances.dto';
import { GenerateInstancesDto } from './dto/generate-instances.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('class-instances')
export class ClassInstancesController {
  constructor(
    private readonly service: ClassInstancesService,
    private readonly generationService: GenerationService,
  ) {}

  @Get()
  findAll(@Query() filters: ListClassInstancesDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateClassInstanceDto) {
    return this.service.createManual(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Post('generate/:templateId')
  generate(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: GenerateInstancesDto,
  ) {
    return this.generationService.generateForTemplate(
      templateId,
      new Date(dto.throughDate),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassInstanceDto,
  ) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(id);
  }
}
