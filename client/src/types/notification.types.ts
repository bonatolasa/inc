import { User } from './user.types';

export interface Notification {
  _id: string;
  userId: string | User;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  readStatus: boolean;
  createdAt: string;
  updatedAt?: string;
}
