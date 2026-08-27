import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { RoomSpot } from './entities/room-spot.entity';
import { RoomsService } from './rooms.service';
import { CreateRoomSpotDto } from './dto/create-room-spot.dto';
import { UpdateRoomSpotDto } from './dto/update-room-spot.dto';

@Injectable()
export class RoomSpotsService {
  constructor(
    @InjectRepository(RoomSpot)
    private readonly repo: Repository<RoomSpot>,
    private readonly roomsService: RoomsService,
  ) {}

  async findAllForRoom(roomId: string): Promise<RoomSpot[]> {
    await this.roomsService.findOne(roomId);
    return this.repo.find({
      where: { roomId },
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RoomSpot> {
    const spot = await this.repo.findOne({ where: { id } });
    if (!spot) throw new NotFoundException('Room spot not found');
    return spot;
  }

  async create(roomId: string, dto: CreateRoomSpotDto): Promise<RoomSpot> {
    await this.roomsService.findOne(roomId);
    const spot = this.repo.create({ ...dto, roomId });
    try {
      return await this.repo.save(spot);
    } catch (err) {
      throw this.translateUniqueViolation(err);
    }
  }

  async update(id: string, dto: UpdateRoomSpotDto): Promise<RoomSpot> {
    const spot = await this.findOne(id);
    Object.assign(spot, dto);
    try {
      return await this.repo.save(spot);
    } catch (err) {
      throw this.translateUniqueViolation(err);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  private translateUniqueViolation(err: unknown): unknown {
    if (
      err instanceof QueryFailedError &&
      (err as unknown as { code?: string }).code === '23505'
    ) {
      return new ConflictException(
        'A spot with that label already exists in this room',
      );
    }
    return err;
  }
}
