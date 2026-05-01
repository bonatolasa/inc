import { Team } from './team.types';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  team: string | Team;
  startDate: string;
  deadline: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
}
