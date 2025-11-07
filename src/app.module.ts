import { Module } from '@nestjs/common';
import { OllamaModule } from './ollama/ollama.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [OllamaModule, ChatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
