import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true, lowercase: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop() invitationTokenHash?: string;
  @Prop() invitationExpiresAt?: Date;
  @Prop() invitationSentAt?: Date;
  @Prop() invitationAcceptedAt?: Date;
  @Prop({ type: [String], default: ['team_member'] }) roles: string[];
  @Prop({ type: [String], default: [] })
  permissions!: string[];  // Direct permissions assigned to user (hybrid RBAC)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Team' })
  team: Types.ObjectId;
  @Prop({ default: true }) isActive: boolean;
  @Prop() lastLogin: Date;
  @Prop() refreshToken: string;
  @Prop() avatar: string;
  @Prop() createdAt: Date;
  @Prop() updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
