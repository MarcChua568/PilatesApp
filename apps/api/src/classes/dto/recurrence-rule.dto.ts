import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

/**
 * The recurrence definition stored (JSON-encoded) on class_templates.recurrence_rule.
 * Deliberately simpler than a full RRULE: weekly-by-weekday within a date range.
 */
export class RecurrenceRuleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[]; // 0 = Sunday .. 6 = Saturday

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string; // "HH:mm", 24-hour, studio local time

  @IsDateString()
  startDate: string; // "YYYY-MM-DD"

  @IsDateString()
  endDate: string; // "YYYY-MM-DD"
}
