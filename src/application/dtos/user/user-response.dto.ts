export class UserResponseDto {
  readonly id: string;
  readonly email: string;
  readonly roles: {
    id: string;
    name: string;
    permissions: string[];
  }[];
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
    roles: {
      id: string;
      name: string;
      permissions: string[];
    }[];
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
    this.roles = data.roles;
    this.profile = data.profile;
    this.emailVerified = data.emailVerified;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
