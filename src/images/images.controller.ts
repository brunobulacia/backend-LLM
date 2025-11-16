import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('images')
export class ImagesController {
  constructor() {
    console.log('🖼️ ImagesController initialized!');
  }

  @Get(':filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    try {
      console.log('🖼️ Sirviendo imagen:', filename);
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

      const imageStream = fs.createReadStream(imagePath);
      imageStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Error al cargar la imagen');
    }
  }
}
