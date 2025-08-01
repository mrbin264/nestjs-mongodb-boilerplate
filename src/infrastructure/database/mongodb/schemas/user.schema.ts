import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    required: true,
  })
  password!: string;

  @Prop({
    type: [String],
    enum: ['system_admin', 'admin', 'user'],
    default: ['user'],
  })
  roles!: string[];

  @Prop({
    type: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      avatar: { type: String, trim: true },
      phone: { type: String, trim: true },
      dateOfBirth: { type: Date },
    },
    _id: false,
  })
  profile!: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    dateOfBirth?: Date;
  };

  @Prop({
    default: false,
  })
  emailVerified!: boolean;

  @Prop({
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: Date,
  })
  lastLoginAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  createdBy?: Types.ObjectId;

  // Timestamps are automatically added by @Schema({ timestamps: true })
  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ roles: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Text search index for profile fields
UserSchema.index({
  email: 'text',
  'profile.firstName': 'text',
  'profile.lastName': 'text',
});

// Virtual for full name
UserSchema.virtual('profile.fullName').get(function() {
  const firstName = this.profile?.firstName || '';
  const lastName = this.profile?.lastName || '';
  return `${firstName} ${lastName}`.trim();
});

// Pre-save hook to update timestamps
UserSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Transform output to remove password from JSON
UserSchema.set('toJSON', {
  virtuals: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: function(doc: any, ret: any) {
    delete ret.password;
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
