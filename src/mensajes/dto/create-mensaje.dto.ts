import {
  Mensaje,
  Emisor,
  TipoContenido,
  EstadoPublicacion,
} from '@prisma/client';

export interface CreateMensajeDto {
  contenido: string;
  emisor: Emisor;
  chatId: string;
  tipo?: TipoContenido;
  rutaImagen?: string;
  contenidoRedesSociales?: any; // JSON con contenido para redes sociales
  estadoPublicacion?: EstadoPublicacion;
  imagenGenerada?: string; // Ruta de imagen generada para redes sociales
}
