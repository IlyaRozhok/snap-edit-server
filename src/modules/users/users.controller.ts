import { Controller, Get, Delete, Post, UseGuards, Request, HttpCode, HttpStatus, Param, ParseUUIDPipe, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

class AddCreditsDto {
  @ApiProperty({ description: 'User UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Number of credits to add', example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  getMe(@Request() req: { user: User }): User {
    return req.user;
  }


  @Post('credits')
  @ApiOperation({ summary: 'Add credits to a user' })
  @ApiResponse({ status: 201, description: 'Credits added, returns updated user', type: User })
  @ApiResponse({ status: 400, description: 'Invalid input — userId must be a UUID, amount must be a positive integer' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  @ApiResponse({ status: 404, description: 'User not found' })
  addCredits(@Body() dto: AddCreditsDto): Promise<User> {
    return this.usersService.addCredits(dto.userId, dto.amount);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account and all associated data' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  async deleteMe(@Request() req: { user: User }): Promise<void> {
    await this.usersService.deleteById(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteById(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.deleteById(id);
  }
}
