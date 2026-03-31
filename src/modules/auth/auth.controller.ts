import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token from iOS GoogleSignIn SDK' })
  @IsString()
  @IsNotEmpty()
  id_token: string;
}

class AppleLoginDto {
  @ApiProperty({ description: 'Apple identity token from ASAuthorizationAppleIDCredential' })
  @IsString()
  @IsNotEmpty()
  id_token: string;

  @ApiProperty({ required: false, description: 'Optional nonce if used on client side' })
  @IsOptional()
  @IsString()
  nonce?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @ApiOperation({ summary: 'Sign in with Google' })
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.id_token);
  }

  @Post('apple')
  @ApiOperation({ summary: 'Sign in with Apple' })
  loginWithApple(@Body() dto: AppleLoginDto) {
    return this.authService.loginWithApple(dto.id_token, dto.nonce);
  }
}
