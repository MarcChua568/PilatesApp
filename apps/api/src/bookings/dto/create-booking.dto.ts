import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class BookingGuestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  spotId?: string;
}

export class CreateBookingDto {
  @IsUUID()
  classInstanceId: string;

  @IsOptional()
  @IsUUID()
  spotId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => BookingGuestDto)
  guests?: BookingGuestDto[];
}
