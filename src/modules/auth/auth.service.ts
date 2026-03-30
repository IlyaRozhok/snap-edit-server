import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignin from 'apple-signin-auth';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async loginWithGoogle(idToken: string): Promise<{ access_token: string; tokens_remaining: number }> {
    let sub: string;
    let email: string | undefined;
    let name: string | undefined;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub) throw new Error('No sub in Google token');
      sub = payload.sub;
      email = payload.email;
      name = payload.name;
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const user = await this.usersService.findOrCreate({
      external_id: sub,
      provider: 'google',
      user_name: name,
      email,
    });

    return this.buildResponse(user);
  }

  async loginWithApple(idToken: string): Promise<{ access_token: string; tokens_remaining: number }> {
    let sub: string;
    let email: string | undefined;

    try {
      const payload = await appleSignin.verifyIdToken(idToken, {
        audience: process.env.APPLE_BUNDLE_ID,
        ignoreExpiration: false,
      });
      if (!payload.sub) throw new Error('No sub in Apple token');
      sub = payload.sub;
      email = payload.email;
    } catch {
      throw new UnauthorizedException('Invalid Apple token');
    }

    const user = await this.usersService.findOrCreate({
      external_id: sub,
      provider: 'apple',
      email,
    });

    return this.buildResponse(user);
  }

  private buildResponse(user: User): { access_token: string; tokens_remaining: number } {
    const access_token = this.jwtService.sign({ sub: user.id });
    return { access_token, tokens_remaining: user.tokens };
  }
}
