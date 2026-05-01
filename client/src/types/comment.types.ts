import { User } from './user.types';
import { Task } from './task.types';

export interface Comment {
  _id: string;
  task: string | Task;
  author: string | User;
  message: string;
  createdAt: string;
  updatedAt: string;
}
