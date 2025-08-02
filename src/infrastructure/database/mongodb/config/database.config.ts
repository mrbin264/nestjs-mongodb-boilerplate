import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

@Injectable()
export class DatabaseConfig implements MongooseOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMongooseOptions(): MongooseModuleOptions {
    const uri = this.configService.get<string>('DATABASE_URL');
    
    if (!uri) {
      throw new Error('DATABASE_URL is not configured');
    }

    return {
      uri,
      maxPoolSize: this.configService.get<number>('MONGODB_MAX_POOL_SIZE', 10),
      serverSelectionTimeoutMS: this.configService.get<number>('MONGODB_SERVER_SELECTION_TIMEOUT', 5000),
      socketTimeoutMS: this.configService.get<number>('MONGODB_SOCKET_TIMEOUT', 45000),
      bufferCommands: false,
    };
  }
}
