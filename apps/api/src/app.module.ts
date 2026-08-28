import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { InstructorsModule } from './instructors/instructors.module';
import { RoomsModule } from './rooms/rooms.module';
import { SettingsModule } from './settings/settings.module';
import { ClassTemplatesModule } from './classes/class-templates.module';
import { ClassInstancesModule } from './classes/class-instances.module';
import { BookingsModule } from './bookings/bookings.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ReportsModule } from './reports/reports.module';
import { InternalModule } from './internal/internal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    // In-process cron for local/persistent hosts. On serverless (Vercel) it
    // never fires — an external scheduler hits POST /internal/sweep instead.
    ...(process.env.DISABLE_IN_PROCESS_CRON === 'true'
      ? []
      : [ScheduleModule.forRoot()]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        // autoLoadEntities picks up every entity registered via forFeature(),
        // so there's no runtime filesystem glob — works when bundled (serverless).
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
        // Serverless invocations must not each hold a big pool open.
        extra: { max: Number(process.env.DB_POOL_MAX ?? 5) },
      }),
    }),
    UsersModule,
    AuthModule,
    InstructorsModule,
    RoomsModule,
    SettingsModule,
    ClassTemplatesModule,
    ClassInstancesModule,
    BookingsModule,
    AttendanceModule,
    AnnouncementsModule,
    ReportsModule,
    InternalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
