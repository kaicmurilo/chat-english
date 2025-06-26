
export class ChatRequestDto {
  history: { role: 'user' | 'bot'; content: string }[]
}
