
export class Message {
    constructor(
      public readonly role: 'user' | 'bot',
      public readonly content: string,
    ) {}
  }
  