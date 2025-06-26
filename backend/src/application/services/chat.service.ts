// src/application/services/chat.service.ts
import { Injectable } from '@nestjs/common'
import { IChatService } from '../interfaces/chat-service.interface'
import { Message } from '../../domain/entities/message.entity'
import { OllamaRepository } from '../repositories/ollama.repository'

@Injectable()
export class ChatService implements IChatService {
  constructor(private readonly repo: OllamaRepository) {}

  async sendWithHistory(history: Message[]): Promise<Message> {
    const botContent = await this.repo.request(history)
    return new Message('bot', botContent)
  }

  // keep legacy if needed
  async send(userMessage: Message): Promise<Message> {
    return this.sendWithHistory([userMessage])
  }
}
