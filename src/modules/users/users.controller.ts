import { Controller, Get, Delete, UseGuards, Request, HttpCode, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

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
