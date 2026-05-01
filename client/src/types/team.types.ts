import { User } from './user.types';
import { Project } from './project.types';

export interface Team {
  _id: string;
  name: string;
  description?: string;
  manager?: string | User;
  members: string[] | User[];
  projects?: string[] | Project[];
  createdAt?: string;
  updatedAt?: string;
}
