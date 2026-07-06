import {User} from './user';
import {Chat} from './chat';
import {MessageReaction} from './reaction';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface Message {
  id: string;
  content: string;
  dateOfSending: string;
  sender: User;
  senderId: string;
  senderUsername: string;
  chat: Chat;
  replyTo: Message | null;
  reactions: MessageReaction[];
  forwardedFrom: Message | null;
  own?: boolean;
  status:MessageStatus
  deliveredAt?: string
}
