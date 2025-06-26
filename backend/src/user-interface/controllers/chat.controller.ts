// src/user-interface/controllers/chat.controller.ts
import { Controller, Post, Body } from '@nestjs/common'
import { ChatService } from '../../application/services/chat.service'
import { ChatRequestDto } from '../dtos/chat-request.dto'
import { ChatResponseDto } from '../dtos/chat-response.dto'
import { Message } from '../../domain/entities/message.entity'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    const msgs = dto.history.map(m => new Message(m.role, m.content))
    const botMsg = await this.chatService.sendWithHistory(msgs)
    return { reply: botMsg.content }
  }
}
