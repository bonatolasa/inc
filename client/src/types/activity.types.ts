import { User } from './user.types';

export interface Activity {
  _id: string;
  user: string | User;
  action: string;
  details?: any;
  createdAt: string;
}
