import { Module } from '@nestjs/common';
import { OllamaModule } from './ollama/ollama.module';
import { ChatModule } from './chat/chat.module';
import { PublicacionModule } from './publicacion/publicacion.module';
import { PromptModule } from './prompt/prompt.module';

@Module({
  imports: [OllamaModule, ChatModule, PublicacionModule, PromptModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
