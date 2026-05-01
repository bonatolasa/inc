import { User } from './user.types';
import { Task } from './task.types';

export interface Attachment {
  _id: string;
  task: string | Task;
  uploadedBy: string | User;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
}
