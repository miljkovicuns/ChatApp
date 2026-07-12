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
  forwardedFrom: Message | null;
  reactions: MessageReaction[];
  own?: boolean;
  status:MessageStatus
  deliveredAt?: string
  isSaved: boolean;
  type: 'USER' | 'SYSTEM'
}
