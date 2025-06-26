// src/infrastructure/repositories/ollama.repository.ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import fetch from 'node-fetch'
import { Message } from '../../domain/entities/message.entity'

@Injectable()
export class OllamaRepository {
  private readonly url: string
  private readonly model: string
  private readonly logger = new Logger(OllamaRepository.name)

  constructor(private config: ConfigService) {
    this.url = this.config.get<string>('OLLAMA_API_URL')!
    this.model = this.config.get<string>('OLLAMA_MODEL') || 'llama2'
  }

  async request(history: Message[]): Promise<string> {
    const systemMessage = {
      role: 'system',
      content: `You are an English practice assistant. Reply in simple English, using few words, and focus on helping the user practice conversation.`
    };
  
    const messages = [
      systemMessage,
      ...history.map(m => ({
        // converte nosso "bot" para "assistant"
        role: m.role === 'bot' ? 'assistant' : m.role,
        content: m.content
      })),
    ];
  
    this.logger.log(`sending messages: ${JSON.stringify(messages)}`);
  
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages, stream: false }),
    });
    const json = await res.json();
    if (!json.choices?.[0]?.message?.content) {
      throw new Error('Ollama empty response');
    }
    return json.choices[0].message.content;
  }
}
