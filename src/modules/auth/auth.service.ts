import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignin from 'apple-signin-auth';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async loginWithGoogle(
    idToken: string,
  ): Promise<{ access_token: string; tokens_remaining: number }> {
    let sub: string;
    let email: string | undefined;
    let name: string | undefined;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub) throw new Error('Missing sub claim');
      sub = payload.sub;
      email = payload.email;
      name = payload.name;
    } catch (err) {
      this.logger.warn(`Google token verification failed: ${err}`);
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

  async loginWithApple(
    idToken: string,
    nonce?: string,
  ): Promise<{ access_token: string; tokens_remaining: number }> {
    let sub: string;
    let email: string | undefined;

    const bundleId = process.env.APPLE_BUNDLE_ID;
    if (!bundleId) {
      throw new UnauthorizedException('Apple auth is not configured');
    }

    try {
      const payload = await appleSignin.verifyIdToken(idToken, {
        /** aud must match the iOS Bundle ID */
        audience: bundleId,
        /** iss must be Apple */
        issuer: 'https://appleid.apple.com',
        /** do not skip expiration check */
        ignoreExpiration: false,
        /** nonce verification — only if client sends it */
        ...(nonce ? { nonce } : {}),
      });

      if (!payload.sub) throw new Error('Missing sub claim');
      if (payload.iss !== 'https://appleid.apple.com') {
        throw new Error('Invalid issuer');
      }

      sub = payload.sub;
      email = payload.email;
    } catch (err) {
      this.logger.warn(`Apple token verification failed: ${err}`);
      throw new UnauthorizedException('Invalid Apple token');
    }

    const user = await this.usersService.findOrCreate({
      external_id: sub,
      provider: 'apple',
      email,
    });

    return this.buildResponse(user);
  }

  private buildResponse(
    user: User,
  ): { access_token: string; tokens_remaining: number } {
    const access_token = this.jwtService.sign({ sub: user.id });
    return { access_token, tokens_remaining: user.tokens };
  }
}
