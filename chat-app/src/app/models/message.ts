export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  isOwn?: boolean; // Frontend-only property
}
