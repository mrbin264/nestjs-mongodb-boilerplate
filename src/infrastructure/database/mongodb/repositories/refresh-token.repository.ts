import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserId } from '../../../../domain/value-objects/user-id.vo';
import { 
  RefreshToken as DomainRefreshToken, 
  IRefreshTokenRepository 
} from '../../../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema';

interface MongoRefreshTokenData {
  _id?: Types.ObjectId | undefined;
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async save(refreshToken: DomainRefreshToken): Promise<DomainRefreshToken> {
    const tokenData = this.mapDomainToMongo(refreshToken);
    
    if (tokenData._id) {
      // Update existing token
      const updated = await this.refreshTokenModel.findByIdAndUpdate(
        tokenData._id,
        { $set: tokenData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!updated) {
        throw new Error('Refresh token not found for update');
      }
      
      return this.mapMongoToDomain(updated);
    } else {
      // Create new token
      const created = await this.refreshTokenModel.create(tokenData);
      return this.mapMongoToDomain(created);
    }
  }

  async findByToken(token: string): Promise<DomainRefreshToken | null> {
    const refreshToken = await this.refreshTokenModel
      .findOne({ token, isRevoked: false })
      .exec();
    
    return refreshToken ? this.mapMongoToDomain(refreshToken) : null;
  }

  async findByUserId(userId: UserId): Promise<DomainRefreshToken[]> {
    const tokens = await this.refreshTokenModel
      .find({ 
        userId: new Types.ObjectId(userId.value), 
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .exec();
    
    return tokens.map(token => this.mapMongoToDomain(token));
  }

  async revoke(token: string): Promise<void> {
    await this.refreshTokenModel.findOneAndUpdate(
      { token },
      { isRevoked: true },
      { runValidators: true }
    ).exec();
  }

  async revokeAllByUserId(userId: UserId): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId.value) },
      { isRevoked: true }
    ).exec();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.refreshTokenModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isRevoked: true }
      ]
    }).exec();
    
    return result.deletedCount || 0;
  }

  async delete(token: string): Promise<void> {
    await this.refreshTokenModel.deleteOne({ token }).exec();
  }

  async findExpiringSoon(minutesBeforeExpiry: number): Promise<DomainRefreshToken[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setMinutes(expiryThreshold.getMinutes() + minutesBeforeExpiry);
    
    const tokens = await this.refreshTokenModel
      .find({
        isRevoked: false,
        expiresAt: { $lt: expiryThreshold, $gt: new Date() }
      })
      .exec();
    
    return tokens.map(token => this.mapMongoToDomain(token));
  }

  async countActiveByUserId(userId: UserId): Promise<number> {
    return await this.refreshTokenModel.countDocuments({
      userId: new Types.ObjectId(userId.value),
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).exec();
  }

  async getUserSessions(userId: UserId): Promise<Array<{
    id: string;
    createdAt: Date;
    lastUsed: Date;
    userAgent?: string;
    ipAddress?: string;
    isCurrent: boolean;
  }>> {
    const tokens = await this.refreshTokenModel
      .find({
        userId: new Types.ObjectId(userId.value),
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .exec();

    return tokens.map(token => ({
      id: (token._id as Types.ObjectId).toString(),
      createdAt: token.createdAt,
      lastUsed: token.createdAt, // Use createdAt as lastUsed for now
      ...(token.userAgent && { userAgent: token.userAgent }),
      ...(token.ipAddress && { ipAddress: token.ipAddress }),
      isCurrent: false, // Would need additional logic to determine current session
    }));
  }

  async revokeSession(userId: UserId, sessionId: string): Promise<void> {
    await this.refreshTokenModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId.value)
      },
      { isRevoked: true },
      { runValidators: true }
    ).exec();
  }

  private mapDomainToMongo(refreshToken: DomainRefreshToken): MongoRefreshTokenData {
    return {
      _id: refreshToken.id ? new Types.ObjectId(refreshToken.id) : undefined,
      userId: new Types.ObjectId(refreshToken.userId.value),
      token: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
      createdAt: refreshToken.createdAt,
      isRevoked: refreshToken.isRevoked,
      userAgent: refreshToken.userAgent || undefined,
      ipAddress: refreshToken.ipAddress || undefined,
    };
  }

  private mapMongoToDomain(tokenDoc: RefreshTokenDocument): DomainRefreshToken {
    return {
      id: (tokenDoc._id as Types.ObjectId).toString(),
      userId: UserId.fromString((tokenDoc.userId as Types.ObjectId).toString()),
      token: tokenDoc.token,
      expiresAt: tokenDoc.expiresAt,
      createdAt: tokenDoc.createdAt,
      isRevoked: tokenDoc.isRevoked,
      ...(tokenDoc.userAgent && { userAgent: tokenDoc.userAgent }),
      ...(tokenDoc.ipAddress && { ipAddress: tokenDoc.ipAddress }),
    };
  }
}
