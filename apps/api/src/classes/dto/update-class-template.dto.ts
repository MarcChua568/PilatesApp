import { PartialType } from '@nestjs/mapped-types';
import { CreateClassTemplateDto } from './create-class-template.dto';

export class UpdateClassTemplateDto extends PartialType(CreateClassTemplateDto) {}
