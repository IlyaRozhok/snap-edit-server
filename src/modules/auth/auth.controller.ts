import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID token obtained from iOS GoogleSignIn SDK (GIDSignIn)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ii...',
  })
  @IsString()
  @IsNotEmpty()
  id_token: string;
}

class AppleLoginDto {
  @ApiProperty({
    description: 'Identity token from ASAuthorizationAppleIDCredential.identityToken (iOS Sign In with Apple)',
    example: 'eyJraWQiOiJXNldjT0tCIiwiYWxnIjoiUlMyNTYifQ...',
  })
  @IsString()
  @IsNotEmpty()
  id_token: string;

  @ApiProperty({
    required: false,
    description: 'Optional nonce (SHA256 hashed) if used on the client side during Sign In with Apple',
    example: 'a1b2c3d4e5f6...',
  })
  @IsOptional()
  @IsString()
  nonce?: string;
}

class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token. Use as: Authorization: Bearer <access_token>',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Number of tokens remaining for API calls. Each /snap_edit/* call costs 1 token.',
    example: 5,
  })
  tokens_remaining: number;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @ApiOperation({
    summary: 'Sign in with Google',
    description: 'Verifies Google ID token and returns a JWT for subsequent API calls. Creates a new user with 5 tokens on first sign in.',
  })
  @ApiResponse({ status: 201, description: 'Successfully authenticated', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired Google ID token' })
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.id_token);
  }

  @Post('apple')
  @ApiOperation({
    summary: 'Sign in with Apple',
    description: 'Verifies Apple identity token and returns a JWT for subsequent API calls. Creates a new user with 5 tokens on first sign in.',
  })
  @ApiResponse({ status: 201, description: 'Successfully authenticated', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired Apple identity token' })
  loginWithApple(@Body() dto: AppleLoginDto) {
    return this.authService.loginWithApple(dto.id_token, dto.nonce);
  }
}
