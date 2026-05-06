import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RoleDocument extends Document {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  name!: string;

  @Prop({ trim: true })
  displayName?: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop()
  description?: string;
}

export const RoleSchema = SchemaFactory.createForClass(RoleDocument);

