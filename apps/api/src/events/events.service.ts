import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventRsvp } from './entities/event-rsvp.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
    @InjectRepository(EventRsvp)
    private readonly rsvpRepo: Repository<EventRsvp>,
    private readonly dataSource: DataSource,
  ) {}

  /** Published events only, soonest first. */
  findPublic(): Promise<Event[]> {
    return this.repo.find({
      where: { publishedAt: Not(IsNull()) },
      order: { startsAt: 'ASC' },
      relations: { hostInstructor: true },
    });
  }

  findAllAdmin(): Promise<Event[]> {
    return this.repo.find({
      order: { startsAt: 'DESC' },
      relations: { hostInstructor: true },
    });
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.repo.findOne({
      where: { slug, publishedAt: Not(IsNull()) },
      relations: { hostInstructor: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  create(dto: CreateEventDto): Promise<Event> {
    const event = this.repo.create(this.fromDto(dto));
    return this.repo.save(event);
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    Object.assign(event, this.fromDto(dto));
    return this.repo.save(event);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Event not found');
  }

  /**
   * Reserve a place for the member (plus guests). Runs under a pessimistic
   * write lock on the event row so concurrent RSVPs cannot push rsvpCount past
   * capacity. Calling again updates the guest count rather than double-booking.
   */
  async rsvp(eventId: string, userId: string, guests = 0): Promise<EventRsvp> {
    return this.dataSource.transaction(async (manager) => {
      const event = await manager
        .createQueryBuilder(Event, 'e')
        .setLock('pessimistic_write')
        .where('e.id = :id', { id: eventId })
        .getOne();
      if (!event) throw new NotFoundException('Event not found');

      const existing = await manager.findOne(EventRsvp, {
        where: { eventId, userId },
      });
      const seatsAfter = 1 + guests;
      const seatsBefore = existing ? 1 + existing.guests : 0;
      const delta = seatsAfter - seatsBefore;

      if (
        event.capacity !== null &&
        delta > 0 &&
        event.rsvpCount + delta > event.capacity
      ) {
        throw new ConflictException('This event is full');
      }

      const rsvp = existing
        ? manager.merge(EventRsvp, existing, { guests })
        : manager.create(EventRsvp, { eventId, userId, guests });
      const saved = await manager.save(rsvp);

      event.rsvpCount += delta;
      await manager.save(event);
      return saved;
    });
  }

  private fromDto(dto: CreateEventDto | UpdateEventDto): Partial<Event> {
    const out: Partial<Event> = {};
    if (dto.title !== undefined) out.title = dto.title;
    if (dto.slug !== undefined) out.slug = dto.slug;
    if (dto.summary !== undefined) out.summary = dto.summary;
    if (dto.body !== undefined) out.body = dto.body;
    if (dto.coverImageUrl !== undefined)
      out.coverImageUrl = dto.coverImageUrl || null;
    if (dto.startsAt !== undefined) out.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined)
      out.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.hostInstructorId !== undefined)
      out.hostInstructorId = dto.hostInstructorId || null;
    if (dto.pricePhp !== undefined) out.pricePhp = dto.pricePhp;
    if (dto.capacity !== undefined) out.capacity = dto.capacity ?? null;
    if (dto.publishedAt !== undefined)
      out.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    return out;
  }
}
