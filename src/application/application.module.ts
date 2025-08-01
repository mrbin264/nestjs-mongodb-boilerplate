import { Module } from '@nestjs/common';

// Use Cases
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  LogoutUserUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  GetUserByIdUseCase,
  GetUsersUseCase,
  UpdateProfileUseCase,
  ChangePasswordUseCase,
  GetProfileUseCase,
} from './use-cases';

// Infrastructure Module for dependencies
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// Domain Services
import { UserDomainService } from '../domain/services/user-domain.service';
import { PasswordDomainService } from '../domain/services/password-domain.service';

// Dependency Injection Tokens
export const REGISTER_USER_USE_CASE = 'REGISTER_USER_USE_CASE';
export const LOGIN_USER_USE_CASE = 'LOGIN_USER_USE_CASE';
export const REFRESH_TOKEN_USE_CASE = 'REFRESH_TOKEN_USE_CASE';
export const FORGOT_PASSWORD_USE_CASE = 'FORGOT_PASSWORD_USE_CASE';
export const RESET_PASSWORD_USE_CASE = 'RESET_PASSWORD_USE_CASE';
export const LOGOUT_USER_USE_CASE = 'LOGOUT_USER_USE_CASE';
export const CREATE_USER_USE_CASE = 'CREATE_USER_USE_CASE';
export const UPDATE_USER_USE_CASE = 'UPDATE_USER_USE_CASE';
export const GET_USER_BY_ID_USE_CASE = 'GET_USER_BY_ID_USE_CASE';
export const GET_USERS_USE_CASE = 'GET_USERS_USE_CASE';
export const UPDATE_PROFILE_USE_CASE = 'UPDATE_PROFILE_USE_CASE';
export const CHANGE_PASSWORD_USE_CASE = 'CHANGE_PASSWORD_USE_CASE';
export const GET_PROFILE_USE_CASE = 'GET_PROFILE_USE_CASE';

@Module({
  imports: [InfrastructureModule],
  providers: [
    // Domain Services
    UserDomainService,
    PasswordDomainService,

    // Authentication Use Cases
    {
      provide: REGISTER_USER_USE_CASE,
      useClass: RegisterUserUseCase,
    },
    {
      provide: LOGIN_USER_USE_CASE,
      useClass: LoginUserUseCase,
    },
    {
      provide: REFRESH_TOKEN_USE_CASE,
      useClass: RefreshTokenUseCase,
    },
    {
      provide: FORGOT_PASSWORD_USE_CASE,
      useClass: ForgotPasswordUseCase,
    },
    {
      provide: RESET_PASSWORD_USE_CASE,
      useClass: ResetPasswordUseCase,
    },
    {
      provide: LOGOUT_USER_USE_CASE,
      useClass: LogoutUserUseCase,
    },

    // User Management Use Cases
    {
      provide: CREATE_USER_USE_CASE,
      useClass: CreateUserUseCase,
    },
    {
      provide: UPDATE_USER_USE_CASE,
      useClass: UpdateUserUseCase,
    },
    {
      provide: GET_USER_BY_ID_USE_CASE,
      useClass: GetUserByIdUseCase,
    },
    {
      provide: GET_USERS_USE_CASE,
      useClass: GetUsersUseCase,
    },

    // Profile Management Use Cases
    {
      provide: UPDATE_PROFILE_USE_CASE,
      useClass: UpdateProfileUseCase,
    },
    {
      provide: CHANGE_PASSWORD_USE_CASE,
      useClass: ChangePasswordUseCase,
    },
    {
      provide: GET_PROFILE_USE_CASE,
      useClass: GetProfileUseCase,
    },

    // Also provide the classes directly for direct injection
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    LogoutUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    GetUserByIdUseCase,
    GetUsersUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    GetProfileUseCase,
  ],
  exports: [
    // Domain Services
    UserDomainService,
    PasswordDomainService,

    // Export tokens for injection
    REGISTER_USER_USE_CASE,
    LOGIN_USER_USE_CASE,
    REFRESH_TOKEN_USE_CASE,
    FORGOT_PASSWORD_USE_CASE,
    RESET_PASSWORD_USE_CASE,
    LOGOUT_USER_USE_CASE,
    CREATE_USER_USE_CASE,
    UPDATE_USER_USE_CASE,
    GET_USER_BY_ID_USE_CASE,
    GET_USERS_USE_CASE,
    UPDATE_PROFILE_USE_CASE,
    CHANGE_PASSWORD_USE_CASE,
    GET_PROFILE_USE_CASE,

    // Export classes for direct injection
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    LogoutUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    GetUserByIdUseCase,
    GetUsersUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    GetProfileUseCase,
  ],
})
export class ApplicationModule {}
