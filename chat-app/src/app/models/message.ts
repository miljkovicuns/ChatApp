import {User} from './user';
import {Chat} from './chat';

export interface Message {
  id: string;
  content: string;
  dateOfSending: string;
  sender: User;
  chat: Chat;
  replyTo: Message | null;
  reactions: any[];
  forwardedFrom: Message | null;
  isOwn?: boolean;
}
