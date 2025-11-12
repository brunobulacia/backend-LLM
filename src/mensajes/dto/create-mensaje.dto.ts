import { Mensaje } from '@prisma/client';

export type CreateMensajeDto = Omit<
  Mensaje,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
>;
