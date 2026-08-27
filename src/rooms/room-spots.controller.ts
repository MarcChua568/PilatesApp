import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoomSpotsService } from './room-spots.service';
import { CreateRoomSpotDto } from './dto/create-room-spot.dto';
import { UpdateRoomSpotDto } from './dto/update-room-spot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller()
export class RoomSpotsController {
  constructor(private readonly roomSpotsService: RoomSpotsService) {}

  @Get('rooms/:roomId/spots')
  findAllForRoom(@Param('roomId', ParseUUIDPipe) roomId: string) {
    return this.roomSpotsService.findAllForRoom(roomId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Post('rooms/:roomId/spots')
  create(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: CreateRoomSpotDto,
  ) {
    return this.roomSpotsService.create(roomId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Patch('spots/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomSpotDto,
  ) {
    return this.roomSpotsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Delete('spots/:id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomSpotsService.remove(id);
  }
}
