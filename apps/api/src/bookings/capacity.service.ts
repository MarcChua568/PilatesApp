import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { ClassInstance } from '../classes/entities/class-instance.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomSpot } from '../rooms/entities/room-spot.entity';
import { User } from '../users/entities/user.entity';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { ClassInstanceStatus } from '../common/enums/class-instance-status.enum';

export interface GuestInput {
  name: string;
  email?: string;
  spotId?: string;
}

export interface BookParams {
  classInstanceId: string;
  spotId?: string | null;
  guests?: GuestInput[];
  /**
   * When a staff/admin books on behalf of a member, the attendee. The caller
   * (bookerUserId) is still recorded as bookedById. Ignored for self-booking —
   * the controller only forwards this for non-member roles.
   */
  memberId?: string;
}

const ACTIVE_STATUSES = [BookingStatus.BOOKED, BookingStatus.WAITLISTED];

/** What promoteOrOfferNextWaitlisted did, so the caller can notify the member. */
interface PromotionOutcome {
  action: 'promoted' | 'offered';
  memberId: string | null;
  className: string;
  startTime: Date;
}

function whenLabel(date: Date): string {
  try {
    return date.toLocaleString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'the scheduled time';
  }
}

@Injectable()
export class CapacityService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
    @Optional()
    private readonly notifications?: NotificationsService,
  ) {}

  /** Best-effort in-app notification; never blocks or fails a booking op. */
  private async notify(outcome: PromotionOutcome | null): Promise<void> {
    if (!this.notifications || !outcome || !outcome.memberId) return;
    if (outcome.action === 'promoted') {
      await this.notifications.safeCreate(
        outcome.memberId,
        'waitlist_promoted',
        'A spot opened up',
        `You're now booked into ${outcome.className} on ${whenLabel(outcome.startTime)}.`,
      );
    } else {
      await this.notifications.safeCreate(
        outcome.memberId,
        'waitlist_promoted',
        'A spot was offered to you',
        `Accept your place in ${outcome.className} before the offer expires.`,
      );
    }
  }

  /**
   * Book the calling member (plus any guests) into a class, or waitlist them
   * when it is full. Everything happens inside one transaction under a
   * pessimistic write lock on the class_instances row — this is the single
   * point where bookedCount is mutated, and the lock is what makes the
   * "no overbooking under concurrency" guarantee hold.
   */
  async book(bookerUserId: string, params: BookParams): Promise<Booking[]> {
    const settings = await this.settingsService.get();

    const { rows, booked, waitlisted } = await this.dataSource.transaction(
      async (manager) => {
      let booked:
        | { memberId: string | null; className: string; startTime: Date }
        | null = null;
      let waitlisted:
        | {
            memberId: string | null;
            className: string;
            position: number | null;
          }
        | null = null;
      const classInstance = await manager
        .createQueryBuilder(ClassInstance, 'ci')
        .setLock('pessimistic_write')
        .where('ci.id = :id', { id: params.classInstanceId })
        .getOne();

      if (!classInstance) throw new NotFoundException('Class instance not found');
      if (classInstance.status === ClassInstanceStatus.CANCELLED) {
        throw new BadRequestException('This class has been cancelled');
      }
      if (
        classInstance.bookableFrom &&
        classInstance.bookableFrom.getTime() > Date.now()
      ) {
        throw new BadRequestException('Booking for this class has not opened yet');
      }
      if (classInstance.startTime.getTime() <= Date.now()) {
        throw new BadRequestException('This class has already started');
      }

      // The attendee: the caller for a self-booking, or the named member when a
      // staff member books on someone's behalf.
      const attendeeId = params.memberId ?? bookerUserId;
      const attendee = await manager.findOne(User, {
        where: { id: attendeeId },
      });
      if (!attendee) throw new NotFoundException('User not found');
      if (!attendee.healthWaiverSignedAt) {
        throw new ForbiddenException(
          params.memberId
            ? 'That member must sign the health waiver before being booked'
            : 'You must sign the health waiver before booking a class',
        );
      }

      const guests = params.guests ?? [];
      const attendeeCount = 1 + guests.length;
      if (attendeeCount > settings.maxSeatsPerBooking) {
        throw new BadRequestException(
          `A booking may hold at most ${settings.maxSeatsPerBooking} seat(s)`,
        );
      }

      const existing = await manager.findOne(Booking, {
        where: {
          memberId: attendeeId,
          classInstanceId: params.classInstanceId,
          status: In(ACTIVE_STATUSES),
        },
      });
      if (existing) {
        throw new ConflictException(
          'You already have an active booking or waitlist entry for this class',
        );
      }

      const room = await manager.findOne(Room, {
        where: { id: classInstance.roomId },
      });
      const usesSpots = !!room?.hasAssignedSpots;
      const available = classInstance.capacity - classInstance.bookedCount;

      // ---- seat the whole party, or waitlist a lone member ----
      if (available >= attendeeCount) {
        const spotIds = usesSpots
          ? await this.resolveRequestedSpots(
              manager,
              classInstance,
              [params.spotId ?? undefined, ...guests.map((g) => g.spotId ?? undefined)],
            )
          : new Array<string | null>(attendeeCount).fill(null);

        const now = new Date();
        const rows: Booking[] = [];
        rows.push(
          manager.create(Booking, {
            memberId: attendeeId,
            bookedById: bookerUserId,
            classInstanceId: params.classInstanceId,
            spotId: spotIds[0],
            status: BookingStatus.BOOKED,
            bookedAt: now,
          }),
        );
        guests.forEach((g, i) => {
          if (!g.name) {
            throw new BadRequestException('Each guest needs a name');
          }
          rows.push(
            manager.create(Booking, {
              memberId: null,
              bookedById: bookerUserId,
              guestName: g.name,
              guestEmail: g.email ?? null,
              classInstanceId: params.classInstanceId,
              spotId: spotIds[i + 1],
              status: BookingStatus.BOOKED,
              bookedAt: now,
            }),
          );
        });

        classInstance.bookedCount += attendeeCount;
        await manager.save(classInstance);
        booked = {
          memberId: attendeeId,
          className: classInstance.name,
          startTime: classInstance.startTime,
        };
        return { rows: await manager.save(rows), booked, waitlisted };
      }

      if (attendeeCount > 1) {
        throw new BadRequestException(
          `Not enough space for your whole party (${available} seat(s) left). Book without guests to join the waitlist.`,
        );
      }

      // ---- waitlist the lone member ----
      const lastWaitlisted = await manager
        .createQueryBuilder(Booking, 'b')
        .where('b.class_instance_id = :id', { id: params.classInstanceId })
        .andWhere('b.status = :status', { status: BookingStatus.WAITLISTED })
        .orderBy('b.waitlist_position', 'DESC')
        .getOne();

      const booking = manager.create(Booking, {
        memberId: attendeeId,
        bookedById: bookerUserId,
        classInstanceId: params.classInstanceId,
        status: BookingStatus.WAITLISTED,
        waitlistPosition: (lastWaitlisted?.waitlistPosition ?? 0) + 1,
        bookedAt: new Date(),
      });
      const saved = await manager.save(booking);
      waitlisted = {
        memberId: attendeeId,
        className: classInstance.name,
        position: saved.waitlistPosition,
      };
      return { rows: [saved], booked, waitlisted };
    });

    if (this.notifications) {
      if (booked && booked.memberId) {
        await this.notifications.safeCreate(
          booked.memberId,
          'booked',
          "You're booked",
          `${booked.className} on ${whenLabel(booked.startTime)}.`,
        );
      } else if (waitlisted && waitlisted.memberId) {
        await this.notifications.safeCreate(
          waitlisted.memberId,
          'booked',
          "You're on the waitlist",
          `Position ${waitlisted.position} for ${waitlisted.className}. We'll let you know if a spot opens.`,
        );
      }
    }

    return rows;
  }

  async cancel(
    bookingId: string,
    userId: string,
  ): Promise<Booking & { wasLateCancellation: boolean }> {
    const settings = await this.settingsService.get();

    const { result, promotion, cancelledFor } =
      await this.dataSource.transaction(async (manager) => {
      let promotion: PromotionOutcome | null = null;
      let cancelledFor:
        | { memberId: string | null; className: string; startTime: Date }
        | null = null;
      const booking = await manager
        .createQueryBuilder(Booking, 'b')
        .where('b.id = :id', { id: bookingId })
        .andWhere('(b.booked_by_id = :uid OR b.member_id = :uid)', { uid: userId })
        .getOne();
      if (!booking) throw new NotFoundException('Booking not found');
      if (!ACTIVE_STATUSES.includes(booking.status)) {
        throw new BadRequestException(
          'This booking cannot be cancelled from its current status',
        );
      }

      const classInstance = await manager
        .createQueryBuilder(ClassInstance, 'ci')
        .setLock('pessimistic_write')
        .where('ci.id = :id', { id: booking.classInstanceId })
        .getOne();

      const hoursUntilStart = classInstance
        ? (classInstance.startTime.getTime() - Date.now()) / 3_600_000
        : Infinity;
      const wasLateCancellation =
        hoursUntilStart < settings.cancellationWindowHours;

      const wasBooked = booking.status === BookingStatus.BOOKED;
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      booking.waitlistPosition = null;
      booking.spotId = null;
      booking.promotionOfferedAt = null;
      booking.promotionOfferExpiresAt = null;
      await manager.save(booking);

      if (wasBooked && classInstance) {
        classInstance.bookedCount -= 1;
        await manager.save(classInstance);
        promotion = await this.promoteOrOfferNextWaitlisted(
          manager,
          classInstance,
        );
      }

      if (classInstance) {
        cancelledFor = {
          memberId: booking.memberId,
          className: classInstance.name,
          startTime: classInstance.startTime,
        };
      }

      return {
        result: Object.assign(booking, { wasLateCancellation }),
        promotion,
        cancelledFor,
      };
    });

    if (this.notifications && cancelledFor && cancelledFor.memberId) {
      await this.notifications.safeCreate(
        cancelledFor.memberId,
        'cancelled',
        'Booking cancelled',
        `${cancelledFor.className} on ${whenLabel(cancelledFor.startTime)}.`,
      );
    }
    await this.notify(promotion);

    return result;
  }

  async recordNoShow(bookingId: string, staffUserId: string): Promise<Booking> {
    const { result, promotion } = await this.dataSource.transaction(
      async (manager) => {
      let promotion: PromotionOutcome | null = null;
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status !== BookingStatus.BOOKED) {
        throw new BadRequestException(
          'Only a booked reservation can be marked as a no-show',
        );
      }

      const classInstance = await manager
        .createQueryBuilder(ClassInstance, 'ci')
        .setLock('pessimistic_write')
        .where('ci.id = :id', { id: booking.classInstanceId })
        .getOne();

      booking.status = BookingStatus.NO_SHOW;
      booking.checkedInById = staffUserId;
      await manager.save(booking);

      const freesSpot =
        !!classInstance && classInstance.startTime.getTime() > Date.now();
      if (freesSpot && classInstance) {
        classInstance.bookedCount -= 1;
        booking.spotId = null;
        await manager.save(booking);
        await manager.save(classInstance);
        promotion = await this.promoteOrOfferNextWaitlisted(
          manager,
          classInstance,
        );
      }

      return { result: booking, promotion };
    });

    await this.notify(promotion);
    return result;
  }

  /**
   * A member accepts a waitlist promotion offer made inside the auto-promote
   * cutoff window. Re-checks capacity under the lock.
   */
  async acceptOffer(bookingId: string, userId: string): Promise<Booking> {
    const { result, confirmed } = await this.dataSource.transaction(
      async (manager) => {
      let confirmed:
        | { memberId: string | null; className: string; startTime: Date }
        | null = null;
      const booking = await manager
        .createQueryBuilder(Booking, 'b')
        .where('b.id = :id', { id: bookingId })
        .andWhere('(b.booked_by_id = :uid OR b.member_id = :uid)', { uid: userId })
        .getOne();
      if (!booking) throw new NotFoundException('Booking not found');
      if (
        booking.status !== BookingStatus.WAITLISTED ||
        !booking.promotionOfferedAt
      ) {
        throw new BadRequestException('No active promotion offer for this booking');
      }

      const classInstance = await manager
        .createQueryBuilder(ClassInstance, 'ci')
        .setLock('pessimistic_write')
        .where('ci.id = :id', { id: booking.classInstanceId })
        .getOne();
      if (!classInstance) throw new NotFoundException('Class instance not found');

      if (
        booking.promotionOfferExpiresAt &&
        booking.promotionOfferExpiresAt.getTime() < Date.now()
      ) {
        booking.promotionOfferedAt = null;
        booking.promotionOfferExpiresAt = null;
        await manager.save(booking);
        await this.promoteOrOfferNextWaitlisted(manager, classInstance);
        throw new BadRequestException('This promotion offer has expired');
      }

      if (classInstance.bookedCount >= classInstance.capacity) {
        booking.promotionOfferedAt = null;
        booking.promotionOfferExpiresAt = null;
        await manager.save(booking);
        throw new ConflictException('The class filled up before you accepted');
      }

      const room = await manager.findOne(Room, {
        where: { id: classInstance.roomId },
      });
      booking.status = BookingStatus.BOOKED;
      booking.waitlistPosition = null;
      booking.promotionOfferedAt = null;
      booking.promotionOfferExpiresAt = null;
      booking.spotId = room?.hasAssignedSpots
        ? await this.assignFreeSpot(manager, classInstance)
        : null;
      await manager.save(booking);

      classInstance.bookedCount += 1;
      await manager.save(classInstance);
      confirmed = {
        memberId: booking.memberId,
        className: classInstance.name,
        startTime: classInstance.startTime,
      };
      return { result: booking, confirmed };
    });

    if (this.notifications && confirmed && confirmed.memberId) {
      await this.notifications.safeCreate(
        confirmed.memberId,
        'waitlist_promoted',
        "You're in",
        `Your spot in ${confirmed.className} on ${whenLabel(confirmed.startTime)} is confirmed.`,
      );
    }

    return result;
  }

  /**
   * Called by the periodic sweep: expire stale promotion offers and pass the
   * offer down the waitlist.
   */
  async lapseExpiredOffers(): Promise<number> {
    const stale = await this.dataSource.getRepository(Booking).find({
      where: { status: BookingStatus.WAITLISTED },
    });
    const expired = stale.filter(
      (b) =>
        b.promotionOfferedAt &&
        b.promotionOfferExpiresAt &&
        b.promotionOfferExpiresAt.getTime() < Date.now(),
    );

    let count = 0;
    for (const b of expired) {
      const promotion = await this.dataSource.transaction(async (manager) => {
        let outcome: PromotionOutcome | null = null;
        const classInstance = await manager
          .createQueryBuilder(ClassInstance, 'ci')
          .setLock('pessimistic_write')
          .where('ci.id = :id', { id: b.classInstanceId })
          .getOne();
        const fresh = await manager.findOne(Booking, { where: { id: b.id } });
        if (!fresh || !fresh.promotionOfferedAt) return null;
        fresh.promotionOfferedAt = null;
        fresh.promotionOfferExpiresAt = null;
        await manager.save(fresh);
        if (classInstance) {
          outcome = await this.promoteOrOfferNextWaitlisted(
            manager,
            classInstance,
          );
        }
        count += 1;
        return outcome;
      });
      await this.notify(promotion);
    }
    return count;
  }

  // ---- internals ----

  private async promoteOrOfferNextWaitlisted(
    manager: EntityManager,
    classInstance: ClassInstance,
  ): Promise<PromotionOutcome | null> {
    if (classInstance.startTime.getTime() <= Date.now()) return null;
    if (classInstance.bookedCount >= classInstance.capacity) return null;

    const next = await manager
      .createQueryBuilder(Booking, 'b')
      .where('b.class_instance_id = :id', { id: classInstance.id })
      .andWhere('b.status = :status', { status: BookingStatus.WAITLISTED })
      .andWhere('b.promotion_offered_at IS NULL')
      .orderBy('b.waitlist_position', 'ASC')
      .getOne();
    if (!next) return null;

    const settings = await this.settingsService.get();
    const hoursUntilStart =
      (classInstance.startTime.getTime() - Date.now()) / 3_600_000;

    if (hoursUntilStart >= settings.waitlistAutoPromoteCutoffHours) {
      const room = await manager.findOne(Room, {
        where: { id: classInstance.roomId },
      });
      next.status = BookingStatus.BOOKED;
      next.waitlistPosition = null;
      next.spotId = room?.hasAssignedSpots
        ? await this.assignFreeSpot(manager, classInstance)
        : null;
      await manager.save(next);
      classInstance.bookedCount += 1;
      await manager.save(classInstance);
      return {
        action: 'promoted',
        memberId: next.memberId,
        className: classInstance.name,
        startTime: classInstance.startTime,
      };
    }

    // inside the cutoff → offer, don't seat
    const now = Date.now();
    next.promotionOfferedAt = new Date(now);
    next.promotionOfferExpiresAt = new Date(
      now + settings.waitlistOfferTtlMinutes * 60_000,
    );
    await manager.save(next);
    return {
      action: 'offered',
      memberId: next.memberId,
      className: classInstance.name,
      startTime: classInstance.startTime,
    };
  }

  private async resolveRequestedSpots(
    manager: EntityManager,
    classInstance: ClassInstance,
    requested: (string | undefined)[],
  ): Promise<string[]> {
    if (requested.some((s) => !s)) {
      throw new BadRequestException(
        'This class assigns spots — every attendee needs a spot',
      );
    }
    const ids = requested as string[];
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Each attendee needs a distinct spot');
    }

    const spots = await manager.find(RoomSpot, { where: { id: In(ids) } });
    if (spots.length !== ids.length) {
      throw new BadRequestException('One or more spots do not exist');
    }
    for (const spot of spots) {
      if (spot.roomId !== classInstance.roomId) {
        throw new BadRequestException('A chosen spot is not in this class\'s room');
      }
      if (!spot.active || !spot.bookable) {
        throw new BadRequestException(`Spot ${spot.label} is not bookable`);
      }
    }

    const taken = await manager
      .createQueryBuilder(Booking, 'b')
      .where('b.class_instance_id = :id', { id: classInstance.id })
      .andWhere('b.status = :status', { status: BookingStatus.BOOKED })
      .andWhere('b.spot_id IN (:...ids)', { ids })
      .getCount();
    if (taken > 0) {
      throw new ConflictException('A chosen spot is already taken');
    }
    return ids;
  }

  private async assignFreeSpot(
    manager: EntityManager,
    classInstance: ClassInstance,
  ): Promise<string | null> {
    const takenRows = await manager
      .createQueryBuilder(Booking, 'b')
      .select('b.spot_id', 'spotId')
      .where('b.class_instance_id = :id', { id: classInstance.id })
      .andWhere('b.status = :status', { status: BookingStatus.BOOKED })
      .andWhere('b.spot_id IS NOT NULL')
      .getRawMany<{ spotId: string }>();
    const takenIds = takenRows.map((r) => r.spotId);

    const qb = manager
      .createQueryBuilder(RoomSpot, 's')
      .where('s.room_id = :roomId', { roomId: classInstance.roomId })
      .andWhere('s.active = true')
      .andWhere('s.bookable = true')
      .orderBy('s.sort_order', 'ASC')
      .addOrderBy('s.label', 'ASC');
    if (takenIds.length) {
      qb.andWhere('s.id NOT IN (:...takenIds)', { takenIds });
    }
    const spot = await qb.getOne();
    return spot?.id ?? null;
  }
}
