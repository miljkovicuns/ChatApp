import {User} from './user';

export interface Chat {
  id: string;
  participants: User[];
  groupChat: boolean;
  name?: string;
  description?: string;
  dateCreated: Date;
  lastMessageAt?: Date;

}
