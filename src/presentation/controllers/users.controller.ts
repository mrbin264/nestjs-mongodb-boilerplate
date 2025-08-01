import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

// DTOs
import { CreateUserDto } from '../../application/dtos/user/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/user/update-user.dto';
import { UserQueryDto } from '../../application/dtos/user/user-query.dto';
import { UserResponseDto } from '../../application/dtos/user/user-response.dto';
import { ResponseDto } from '../../application/dtos/common/response.dto';

// Use Cases
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  GetUserByIdUseCase,
  GetUsersUseCase,
} from '../../application/use-cases';

// Guards and Decorators
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../../domain/entities/role.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a new user', description: 'Create a new user in the system. Requires admin privileges.' })
  @ApiCreatedResponse({ description: 'User created successfully', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin privileges required' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ResponseDto<UserResponseDto>> {
    const result = await this.createUserUseCase.execute(createUserDto);
    return ResponseDto.success(result, 'User created successfully');
  }

  @Get()
  @Roles(Role.ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get users list', description: 'Retrieve a paginated list of users with optional filtering.' })
  @ApiOkResponse({ description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of users to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of users to skip' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by user role (user, admin, system_admin)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by user status' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin privileges required' })
  async getUsers(
    @Query() query: UserQueryDto,
  ): Promise<ResponseDto<{
    users: UserResponseDto[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    const result = await this.getUsersUseCase.execute(query);
    return result; // Result is already wrapped in ResponseDto from the use case
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieve a specific user by their ID.' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({ description: 'User retrieved successfully', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin privileges required' })
  async getUserById(
    @Param('id') id: string,
  ): Promise<ResponseDto<UserResponseDto>> {
    const result = await this.getUserByIdUseCase.execute(id);
    return ResponseDto.success(result, 'User retrieved successfully');
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update user', description: 'Update an existing user by their ID.' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({ description: 'User updated successfully', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin privileges required' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseDto<UserResponseDto>> {
    const result = await this.updateUserUseCase.execute(id, updateUserDto);
    return ResponseDto.success(result, 'User updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete user', description: 'Delete a user by their ID. Currently not implemented.' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({ description: 'User deletion endpoint (not implemented)' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'System admin privileges required' })
  async deleteUser(): Promise<ResponseDto<{ message: string }>> {
    // For now, we'll just return a message since soft delete 
    // would require extending the UpdateUserDto or creating a separate use case
    return ResponseDto.success(
      { message: 'User deletion not implemented yet' },
      'User deletion endpoint'
    );
  }
}
