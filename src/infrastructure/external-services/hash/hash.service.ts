import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IHashService } from '../../../domain/services/hash.service.interface';

@Injectable()
export class HashService implements IHashService {
  private readonly saltRounds = 12;

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }

  async generateSalt(): Promise<string> {
    return bcrypt.genSalt(this.saltRounds);
  }

  async hashWithSalt(plainText: string, salt: string): Promise<string> {
    return bcrypt.hash(plainText, salt);
  }

  isHashed(text: string): boolean {
    // bcrypt hashes always start with $2a$, $2b$, $2x$, or $2y$
    return /^\$2[abxy]\$\d{2}\$.{53}$/.test(text);
  }

  getHashInfo(hashedText: string): { algorithm: string; rounds: number } | null {
    const match = hashedText.match(/^\$2([abxy])\$(\d{2})\$/);
    if (!match) {
      return null;
    }

    return {
      algorithm: `bcrypt-2${match[1]}`,
      rounds: parseInt(match[2], 10),
    };
  }
}
