import { Message } from '../../domain/entities/message.entity'

export interface IChatService {
  send(userMessage: Message): Promise<Message>
}