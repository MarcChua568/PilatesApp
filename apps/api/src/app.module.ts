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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
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
  ],
  controllers: [HealthController],
})
export class AppModule {}
