import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  provider: 'local' | 'google' | 'discord';
  iat: number;
  exp: number;
};

type SignPayloadInput = Omit<JwtPayload, 'iat' | 'exp'>;

@Injectable()
export class JwtService {
  private readonly secret = process.env.JWT_SECRET ?? 'dev_secret_change_me';
  private readonly expiresInSeconds = 60 * 60; // 1 hora

  sign(payload: SignPayloadInput): string {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: nowInSeconds,
      exp: nowInSeconds + this.expiresInSeconds,
    };

    const encodedHeader = this.base64UrlEncode(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = this.signData(data);

    return `${data}.${signature}`;
  }

  verify(token: string): JwtPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Token JWT invalido');
    }

    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.signData(data);
    const signatureIsValid = this.safeEqual(signature, expectedSignature);

    if (!signatureIsValid) {
      throw new UnauthorizedException('Assinatura JWT invalida');
    }

    const payload = JSON.parse(
      this.base64UrlDecode(encodedPayload),
    ) as JwtPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token JWT expirado');
    }

    return payload;
  }

  private signData(data: string): string {
    return this.base64UrlFromBuffer(
      createHmac('sha256', this.secret).update(data).digest(),
    );
  }

  private base64UrlEncode(value: string): string {
    return this.base64UrlFromBuffer(Buffer.from(value, 'utf8'));
  }

  private base64UrlDecode(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const withPadding = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );

    return Buffer.from(withPadding, 'base64').toString('utf8');
  }

  private base64UrlFromBuffer(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private safeEqual(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return timingSafeEqual(bufferA, bufferB);
  }
}
