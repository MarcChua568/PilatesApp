import { IsObject } from 'class-validator';

export class UpsertSiteContentDto {
  @IsObject()
  data: Record<string, unknown>;
}
