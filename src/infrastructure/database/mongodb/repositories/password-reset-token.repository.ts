import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserId } from '../../../../domain/value-objects/user-id.vo';
import { 
  PasswordResetToken as DomainPasswordResetToken,
  IPasswordResetTokenRepository 
} from '../../../../domain/repositories/password-reset-token.repository.interface';
import { PasswordResetToken, PasswordResetTokenDocument } from '../schemas/password-reset-token.schema';

interface MongoPasswordResetTokenData {
  _id?: Types.ObjectId | undefined;
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  usedAt?: Date | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectModel(PasswordResetToken.name) private passwordResetTokenModel: Model<PasswordResetTokenDocument>,
  ) {}

  async save(token: DomainPasswordResetToken): Promise<DomainPasswordResetToken> {
    const tokenData = this.mapDomainToMongo(token);
    
    if (tokenData._id) {
      // Update existing token
      const updated = await this.passwordResetTokenModel.findByIdAndUpdate(
        tokenData._id,
        { $set: tokenData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!updated) {
        throw new Error('Password reset token not found for update');
      }
      
      return this.mapMongoToDomain(updated);
    } else {
      // Create new token
      const created = await this.passwordResetTokenModel.create(tokenData);
      return this.mapMongoToDomain(created);
    }
  }

  async findByToken(token: string): Promise<DomainPasswordResetToken | null> {
    const resetToken = await this.passwordResetTokenModel
      .findOne({ 
        token, 
        used: false,
        expiresAt: { $gt: new Date() }
      })
      .exec();
    
    return resetToken ? this.mapMongoToDomain(resetToken) : null;
  }

  async findActiveByUserId(userId: UserId): Promise<DomainPasswordResetToken | null> {
    const token = await this.passwordResetTokenModel
      .findOne({ 
        userId: new Types.ObjectId(userId.value),
        used: false,
        expiresAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .exec();
    
    return token ? this.mapMongoToDomain(token) : null;
  }

  async findByUserId(userId: UserId): Promise<DomainPasswordResetToken[]> {
    const tokens = await this.passwordResetTokenModel
      .find({ 
        userId: new Types.ObjectId(userId.value)
      })
      .sort({ createdAt: -1 })
      .exec();
    
    return tokens.map(token => this.mapMongoToDomain(token));
  }

  async markAsUsed(token: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const updateData: Record<string, unknown> = { 
      used: true,
      usedAt: new Date()
    };
    
    if (ipAddress) updateData.ipAddress = ipAddress;
    if (userAgent) updateData.userAgent = userAgent;

    await this.passwordResetTokenModel.findOneAndUpdate(
      { token },
      updateData,
      { runValidators: true }
    ).exec();
  }

  async invalidateAllByUserId(userId: UserId): Promise<void> {
    await this.passwordResetTokenModel.updateMany(
      { userId: new Types.ObjectId(userId.value) },
      { 
        used: true,
        usedAt: new Date()
      }
    ).exec();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.passwordResetTokenModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true }
      ]
    }).exec();
    
    return result.deletedCount || 0;
  }

  async countRecentByUserId(userId: UserId, minutesAgo: number): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesAgo);
    
    return await this.passwordResetTokenModel.countDocuments({
      userId: new Types.ObjectId(userId.value),
      createdAt: { $gt: cutoffTime }
    }).exec();
  }

  async delete(token: string): Promise<void> {
    await this.passwordResetTokenModel.deleteOne({ token }).exec();
  }

  async countRecentByIpAddress(ipAddress: string, minutesAgo: number): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesAgo);
    
    return await this.passwordResetTokenModel.countDocuments({
      ipAddress,
      createdAt: { $gt: cutoffTime }
    }).exec();
  }

  private mapDomainToMongo(token: DomainPasswordResetToken): MongoPasswordResetTokenData {
    return {
      _id: token.id ? new Types.ObjectId(token.id) : undefined,
      userId: new Types.ObjectId(token.userId.value),
      token: token.token,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      used: token.used,
      usedAt: token.usedAt || undefined,
      ipAddress: token.ipAddress || undefined,
      userAgent: token.userAgent || undefined,
    };
  }

  private mapMongoToDomain(tokenDoc: PasswordResetTokenDocument): DomainPasswordResetToken {
    return {
      id: (tokenDoc._id as Types.ObjectId).toString(),
      userId: UserId.fromString((tokenDoc.userId as Types.ObjectId).toString()),
      token: tokenDoc.token,
      expiresAt: tokenDoc.expiresAt,
      createdAt: tokenDoc.createdAt,
      used: tokenDoc.used,
      ...(tokenDoc.usedAt && { usedAt: tokenDoc.usedAt }),
      ...(tokenDoc.ipAddress && { ipAddress: tokenDoc.ipAddress }),
      ...(tokenDoc.userAgent && { userAgent: tokenDoc.userAgent }),
    };
  }
}
