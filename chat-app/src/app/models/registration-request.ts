import {User} from './user';

export interface RegistrationRequest {
  id: string,
  sentAt: Date
  processedAt?: Date
  user: User
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}
