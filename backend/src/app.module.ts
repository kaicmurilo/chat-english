import { Module } from '@nestjs/common'
import { ChatController } from './user-interface/controllers/chat.controller'
import { ChatService } from './application/services/chat.service'
import { OllamaRepository } from './application/repositories/ollama.repository'
import { ConfigModule } from '@nestjs/config'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, OllamaRepository],
})
export class AppModule {}