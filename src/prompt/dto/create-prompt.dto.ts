import { Prompt } from '@prisma/client';

export type CreatePromptDto = Omit<
  Prompt,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
>;
