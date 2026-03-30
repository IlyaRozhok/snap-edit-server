import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class GoogleLoginDto {
  id_token: string;
}

class AppleLoginDto {
  id_token: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.id_token);
  }

  @Post('apple')
  loginWithApple(@Body() dto: AppleLoginDto) {
    return this.authService.loginWithApple(dto.id_token);
  }
}
