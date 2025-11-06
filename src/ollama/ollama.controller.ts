import { Body, Controller, Post } from '@nestjs/common';
import { OllamaService } from './ollama.service';

@Controller('ollama')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Post('generate')
  async generateResponse(@Body('prompt') prompt: string): Promise<string> {
    return this.ollamaService.generateResponse(prompt);
  }
}
