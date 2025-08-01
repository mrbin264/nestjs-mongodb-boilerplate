import { Types } from 'mongoose';

export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!this.isValidObjectId(value)) {
      throw new Error(`Invalid UserId format: ${value}`);
    }
    this._value = value;
  }

  static generate(): UserId {
    return new UserId(new Types.ObjectId().toString());
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  static fromObjectId(objectId: Types.ObjectId): UserId {
    return new UserId(objectId.toString());
  }

  get value(): string {
    return this._value;
  }

  toObjectId(): Types.ObjectId {
    return new Types.ObjectId(this._value);
  }

  toString(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  private isValidObjectId(value: string): boolean {
    return Types.ObjectId.isValid(value);
  }

  toJSON(): string {
    return this._value;
  }
}
