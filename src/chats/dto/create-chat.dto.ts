import { Chat } from '@prisma/client';
export type CreateChatDto = Omit<
  Chat,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
>;
