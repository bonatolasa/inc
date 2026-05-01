import { Project } from './project.types';
import { User } from './user.types';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  project: string | Project;
  assignedTo: User[];
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  percentageComplete: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  startedAt?: string;
  dependencies?: string[];
  estimatedHours?: number;
  actualHours?: number;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}
