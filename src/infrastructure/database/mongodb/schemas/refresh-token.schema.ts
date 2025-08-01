import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({
  timestamps: true,
  collection: 'refresh_tokens',
})
export class RefreshToken {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
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
  isRevoked!: boolean;

  @Prop({
    trim: true,
  })
  userAgent?: string;

  @Prop({
    trim: true,
  })
  ipAddress?: string;

  // Timestamps are automatically added
  createdAt!: Date;
  updatedAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Indexes
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ isRevoked: 1 });

// Pre-save hook to set expiration
RefreshTokenSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Set expiration to 7 days from now if not set
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Transform output
RefreshTokenSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
