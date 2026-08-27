import { PartialType } from '@nestjs/mapped-types';
import { CreateClassInstanceDto } from './create-class-instance.dto';

export class UpdateClassInstanceDto extends PartialType(CreateClassInstanceDto) {}
