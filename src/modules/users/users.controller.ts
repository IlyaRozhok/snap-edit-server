import { Controller, Get, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteMe(@Request() req: { user: User }): Promise<void> {
    await this.usersService.deleteById(req.user.id);
  }
}
