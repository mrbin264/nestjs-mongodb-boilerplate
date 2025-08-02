import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User as DomainUser } from '../../../../domain/entities/user.entity';
import { Email } from '../../../../domain/value-objects/email.vo';
import { Password } from '../../../../domain/value-objects/password.vo';
import { UserId } from '../../../../domain/value-objects/user-id.vo';
import { Role } from '../../../../domain/entities/role.entity';
import { 
  IUserRepository, 
  UserQueryOptions, 
  UserQueryResult 
} from '../../../../domain/repositories/user.repository.interface';
import { User, UserDocument } from '../schemas/user.schema';

interface MongoUserData {
  _id?: Types.ObjectId | undefined;
  email: string;
  password: string;
  roles: string[];
  profile: {
    firstName?: string | undefined;
    lastName?: string | undefined;
    avatar?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: Date | undefined;
  };
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async save(user: DomainUser): Promise<DomainUser> {
    const userData = this.mapDomainToMongo(user);
    
    if (userData._id) {
      // Try to update existing user first
      const updated = await this.userModel.findByIdAndUpdate(
        userData._id,
        { $set: userData },
        { new: true, runValidators: true }
      ).exec();
      
      if (updated) {
        return this.mapMongoToDomain(updated);
      }
      
      // If user doesn't exist, create new user with the provided ID
      const created = await this.userModel.create(userData);
      return this.mapMongoToDomain(created);
    } else {
      // Create new user without ID (let MongoDB generate it)
      const created = await this.userModel.create(userData);
      return this.mapMongoToDomain(created);
    }
  }

  async findById(id: UserId): Promise<DomainUser | null> {
    const user = await this.userModel.findById(id.value).exec();
    return user ? this.mapMongoToDomain(user) : null;
  }

  async findByEmail(email: Email): Promise<DomainUser | null> {
    const user = await this.userModel.findOne({ email: email.value }).exec();
    return user ? this.mapMongoToDomain(user) : null;
  }

  async findByRole(role: Role, options?: UserQueryOptions): Promise<UserQueryResult> {
    const query = this.userModel.find({ roles: role.value, isActive: true });
    return this.executeQuery(query, options);
  }

  async findMany(options?: UserQueryOptions): Promise<UserQueryResult> {
    const query = this.userModel.find({ isActive: true });
    return this.executeQuery(query, options);
  }

  async existsByEmail(email: Email, excludeUserId?: UserId): Promise<boolean> {
    const query: Record<string, unknown> = { email: email.value };
    if (excludeUserId) {
      query._id = { $ne: new Types.ObjectId(excludeUserId.value) };
    }
    const count = await this.userModel.countDocuments(query).exec();
    return count > 0;
  }

  async delete(id: UserId): Promise<void> {
    await this.userModel.findByIdAndDelete(id.value).exec();
  }

  async softDelete(id: UserId): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      id.value,
      { isActive: false, updatedAt: new Date() },
      { runValidators: true }
    ).exec();
  }

  async findByCreator(creatorId: UserId, options?: UserQueryOptions): Promise<UserQueryResult> {
    const query = this.userModel.find({ createdBy: new Types.ObjectId(creatorId.value) });
    return this.executeQuery(query, options);
  }

  async findByIds(ids: UserId[]): Promise<DomainUser[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id.value));
    const users = await this.userModel.find({ _id: { $in: objectIds } }).exec();
    return users.map(user => this.mapMongoToDomain(user));
  }

  async count(options?: Omit<UserQueryOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number> {
    const query = this.userModel.find({ isActive: true });
    this.applyFilters(query, options);
    return query.countDocuments().exec();
  }

  async updateLastLogin(id: UserId): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      id.value,
      { lastLoginAt: new Date(), updatedAt: new Date() },
      { runValidators: true }
    ).exec();
  }

  async findUnverifiedUsers(daysSinceCreation: number): Promise<DomainUser[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceCreation);
    
    const users = await this.userModel.find({
      emailVerified: false,
      createdAt: { $lt: cutoffDate }
    }).exec();
    
    return users.map(user => this.mapMongoToDomain(user));
  }

  async updateMany(ids: UserId[], updates: Partial<Pick<DomainUser, 'isActive' | 'emailVerified'>>): Promise<void> {
    const objectIds = ids.map(id => new Types.ObjectId(id.value));
    await this.userModel.updateMany(
      { _id: { $in: objectIds } },
      { $set: { ...updates, updatedAt: new Date() } }
    ).exec();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeQuery(query: any, options?: UserQueryOptions): Promise<UserQueryResult> {
    this.applyFilters(query, options);

    // Get total count before pagination
    const countQuery = query.clone();
    const total = await countQuery.countDocuments().exec();
    
    // Apply sorting
    if (options?.sortBy) {
      const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
      query.sort({ [options.sortBy]: sortOrder });
    } else {
      query.sort({ createdAt: -1 });
    }
    
    // Apply pagination
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    
    const users = await query
      .skip(offset)
      .limit(limit)
      .exec();

    return {
      users: users.map((user: UserDocument) => this.mapMongoToDomain(user)),
      total,
      hasMore: offset + users.length < total,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyFilters(query: any, options?: UserQueryOptions): void {
    if (options?.search) {
      query.find({ $text: { $search: options.search } });
    }
    if (options?.role) {
      query.find({ roles: options.role.value });
    }
    if (options?.emailVerified !== undefined) {
      query.find({ emailVerified: options.emailVerified });
    }
    if (options?.isActive !== undefined) {
      query.find({ isActive: options.isActive });
    }
  }

  private mapDomainToMongo(user: DomainUser): MongoUserData {
    return {
      _id: user.id ? new Types.ObjectId(user.id.value) : undefined,
      email: user.email.value,
      password: user.password.hashedValue,
      roles: user.roles.map(role => role.value),
      profile: {
        firstName: user.profile.firstName || undefined,
        lastName: user.profile.lastName || undefined,
        avatar: user.profile.avatar || undefined,
        phone: user.profile.phone || undefined,
        dateOfBirth: user.profile.dateOfBirth || undefined,
      },
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapMongoToDomain(userDoc: UserDocument): DomainUser {
    const roles = userDoc.roles.map(roleName => Role.fromString(roleName));
    
    // Build profile object with proper optional handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile: any = {};
    if (userDoc.profile?.firstName) profile.firstName = userDoc.profile.firstName;
    if (userDoc.profile?.lastName) profile.lastName = userDoc.profile.lastName;
    if (userDoc.profile?.avatar) profile.avatar = userDoc.profile.avatar;
    if (userDoc.profile?.phone) profile.phone = userDoc.profile.phone;
    if (userDoc.profile?.dateOfBirth) profile.dateOfBirth = userDoc.profile.dateOfBirth;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userProps: any = {
      id: UserId.fromString((userDoc._id as Types.ObjectId).toString()),
      email: Email.create(userDoc.email),
      password: Password.fromHash(userDoc.password),
      roles,
      profile,
      emailVerified: userDoc.emailVerified,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    };
    
    if (userDoc.lastLoginAt) {
      userProps.lastLoginAt = userDoc.lastLoginAt;
    }
    
    return new DomainUser(userProps);
  }
}
