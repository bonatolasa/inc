export class TaskProjectDto {
  _id!: string;
  name!: string;
}

export class TaskUserDto {
  _id!: string;
  name!: string;
  email!: string;
}

export class TaskResponseDto {
  _id!: string;
  title!: string;
  description?: string;
  project?: TaskProjectDto;
  assignedTo?: TaskUserDto[];
  createdBy?: TaskUserDto;
  status!: string;
  percentageComplete!: number;
  priority!: string;
  dueDate!: Date;
  startedAt?: Date;
  completedAt?: Date;
  dependencies!: string[];
  estimatedHours?: number;
  actualHours?: number;
  comments?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class TaskListResponseDto {
  success!: boolean;
  data!: TaskResponseDto[];
  message!: string;
}

export class SingleTaskResponseDto {
  success!: boolean;
  data!: TaskResponseDto;
  message!: string;
}
