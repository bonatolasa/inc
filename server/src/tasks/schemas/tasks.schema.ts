import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { TaskStatus } from '../../enums/task-status.enum';
import { Priority } from '../../enums/priority.enum';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
  project!: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true })
  assignedTo!: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING })
  status!: TaskStatus;

  @Prop({ default: 0, min: 0, max: 100 })
  percentageComplete!: number;

  @Prop({ enum: Priority, default: Priority.MEDIUM })
  priority!: Priority;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop()
  startedAt!: Date;

  @Prop()
  completedAt!: Date;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Task' }])
  dependencies!: Types.ObjectId[];

  @Prop()
  estimatedHours!: number;

  @Prop()
  actualHours!: number;

  @Prop()
  comments!: string;

  @Prop() createdAt!: Date;
  @Prop() updatedAt!: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
