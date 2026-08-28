import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
} from '@nestjs/common';
import { NoShowSweepService } from '../attendance/no-show-sweep.service';
import { CapacityService } from '../bookings/capacity.service';

/**
 * Triggered by an external scheduler because @nestjs/schedule's in-process cron
 * never fires on serverless hosts. Vercel Cron sends a GET with an
 * `Authorization: Bearer <CRON_SECRET>` header; other schedulers (cron-job.org,
 * GitHub Actions) can POST with `x-sweep-secret: <SWEEP_SECRET>`.
 */
@Controller('internal')
export class InternalController {
  constructor(
    private readonly sweep: NoShowSweepService,
    private readonly capacity: CapacityService,
  ) {}

  @Get('sweep')
  runSweepGet(@Headers('authorization') auth?: string) {
    return this.runSweep(this.authorize(auth, undefined));
  }

  @Post('sweep')
  runSweepPost(
    @Headers('authorization') auth?: string,
    @Headers('x-sweep-secret') secret?: string,
  ) {
    return this.runSweep(this.authorize(auth, secret));
  }

  private authorize(auth: string | undefined, secret: string | undefined): true {
    const cronSecret = process.env.CRON_SECRET;
    const sweepSecret = process.env.SWEEP_SECRET;
    const bearerOk =
      !!cronSecret && auth === `Bearer ${cronSecret}`;
    const headerOk = !!sweepSecret && secret === sweepSecret;
    if (!bearerOk && !headerOk) {
      throw new ForbiddenException('Bad or missing sweep credentials');
    }
    return true;
  }

  private async runSweep(_ok: true) {
    const noShows = await this.sweep.sweepNoShows();
    const lapsedOffers = await this.capacity.lapseExpiredOffers();
    return { noShows, lapsedOffers };
  }
}
