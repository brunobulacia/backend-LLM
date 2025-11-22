import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import { CreateTiktokDto } from './dto/create-tiktok.dto';
import { UpdateTiktokDto } from './dto/update-tiktok.dto';

@Controller()
export class TiktokController {
  constructor(private readonly tiktokService: TiktokService) {}

  @Get('/terminos_y_condiciones')
  findAll() {
    return this.tiktokService.findTerminosYCondiciones();
  }

  @Get('/callback')
  findCallback(@Query('code') code: string) {
    return this.tiktokService.findCallback(code);
  }
}
