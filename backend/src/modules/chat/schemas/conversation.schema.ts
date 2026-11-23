import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Statement', required: true })
  statementId: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  messages: Message[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ userId: 1, statementId: 1 }, { unique: true });
