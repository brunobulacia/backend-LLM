import { Mensaje, Emisor, TipoContenido } from '@prisma/client';

export interface CreateMensajeDto {
  contenido: string;
  emisor: Emisor;
  chatId: string;
  tipo?: TipoContenido;
  rutaImagen?: string;
}
