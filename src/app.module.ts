import { Module } from '@nestjs/common';
import { OllamaModule } from './ollama/ollama.module';

@Module({
  imports: [OllamaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
