import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomSpotDto } from './create-room-spot.dto';

export class UpdateRoomSpotDto extends PartialType(CreateRoomSpotDto) {}
