export class ProfileResponseDto {
  readonly id: string;
  readonly email: string;
  readonly profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
  };
  readonly emailVerified: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: {
    id: string;
    email: string;
    profile: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      phone?: string;
    };
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.profile = data.profile;
    this.emailVerified = data.emailVerified;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
