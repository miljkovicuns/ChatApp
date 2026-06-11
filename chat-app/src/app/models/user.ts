export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt?: Date;
  lastOnline?: Date;
  role: string;
}
