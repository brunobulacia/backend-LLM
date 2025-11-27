import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Options,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('images')
export class ImagesController {
  constructor() {
    console.log('🖼️ ImagesController initialized!');
  }

  @Options(':filename')
  async handleOptions(@Res() res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, ngrok-skip-browser-warning, Authorization',
    );
    res.setHeader('ngrok-skip-browser-warning', 'true');
    res.status(200).send();
  }

  @Get(':filename')
  async getImage(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      console.log('🖼️ Sirviendo imagen:', filename);
      console.log('🔍 Headers de request:', req.headers);
      console.log('🔍 Origin:', req.headers.origin);
      console.log('🔍 User-Agent:', req.headers['user-agent']);

      const imagePath = path.join(process.cwd(), 'uploads', 'images', filename);
      console.log('📁 Ruta completa:', imagePath);

      // Verificar si el archivo existe
      if (!fs.existsSync(imagePath)) {
        console.log('❌ Imagen no encontrada:', imagePath);
        throw new NotFoundException('Imagen no encontrada');
      }

      console.log('✅ Imagen encontrada, sirviendo...');

      // Determinar el tipo de contenido basado en la extensión
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'image/jpeg'; // default

      switch (ext) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas

      // Headers para ngrok y CORS
      res.setHeader('ngrok-skip-browser-warning', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, ngrok-skip-browser-warning',
      );

      const imageStream = fs.createReadStream(imagePath);
      imageStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Error al cargar la imagen');
    }
  }
}
