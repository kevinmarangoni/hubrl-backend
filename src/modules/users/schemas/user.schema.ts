import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AuthProvider } from '../dto/auth-provider.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ required: true, enum: Object.values(AuthProvider) })
  provider: AuthProvider;

  @Prop({ type: Date, default: null })
  lastLogin?: Date | null;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  @Prop({ type: String, default: null })
  avatarPublicId?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
