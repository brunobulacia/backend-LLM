import { Publicacion } from '@prisma/client';

export type CreatePublicacionDto = Omit<
  Publicacion,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
>;
