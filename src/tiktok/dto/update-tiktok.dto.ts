import { PartialType } from '@nestjs/mapped-types';
import { CreateTiktokDto } from './create-tiktok.dto';

export class UpdateTiktokDto extends PartialType(CreateTiktokDto) {}
