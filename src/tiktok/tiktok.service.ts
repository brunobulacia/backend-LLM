import { Injectable } from '@nestjs/common';
import { CreateTiktokDto } from './dto/create-tiktok.dto';
import { UpdateTiktokDto } from './dto/update-tiktok.dto';

@Injectable()
export class TiktokService {
  findTerminosYCondiciones() {
    return `This action returns all tiktok terms and conditions`;
  }

  findCallback(code: string) {
    return `This action returns tiktok callback data for code: ${code}`;
  }
}
