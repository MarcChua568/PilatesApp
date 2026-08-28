import {
  Equals,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SubmitWaiverDto {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  @MinLength(1)
  emergencyContactName: string;

  @IsString()
  @MinLength(1)
  emergencyContactPhone: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms to continue' })
  acceptedTerms: boolean;

  @IsString()
  @MinLength(1)
  signature: string;
}
