import { Injectable } from '@nestjs/common';
import { Ollama } from 'ollama';

@Injectable()
export class OllamaService {
  ollama = new Ollama();
  async generateResponse(prompt: string): Promise<string> {
    const response = await this.ollama.chat({
      model: 'gpt-oss:120b-cloud',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });
    let message = '';
    for await (const part of response) {
      process.stdout.write(part.message.content);
      message += part.message.content;
    }
    return message;
  }
}
