import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetTokenDocument = PasswordResetToken & Document;

@Schema({
  timestamps: true,
  collection: 'password_reset_tokens',
})
export class PasswordResetToken {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  token!: string;

  @Prop({
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index
  })
  expiresAt!: Date;

  @Prop({
    default: false,
  })
  used!: boolean;

  @Prop({
    type: Date,
  })
  usedAt?: Date;

  @Prop({
    trim: true,
  })
  ipAddress?: string;

  @Prop({
    trim: true,
  })
  userAgent?: string;

  // Timestamps are automatically added
  createdAt!: Date;
  updatedAt!: Date;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);

// Indexes
PasswordResetTokenSchema.index({ userId: 1 });
PasswordResetTokenSchema.index({ token: 1 }, { unique: true });
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ used: 1 });

// Pre-save hook to set expiration
PasswordResetTokenSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Set expiration to 1 hour from now if not set
    this.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  }
  next();
});

// Transform output
PasswordResetTokenSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
