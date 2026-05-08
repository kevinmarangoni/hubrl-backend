import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  private readonly keyLength = 64;

  hash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, this.keyLength).toString('hex');
    return `${salt}:${hash}`;
  }

  compare(password: string, storedHash: string): boolean {
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) {
      return false;
    }

    const computedHash = scryptSync(password, salt, this.keyLength);
    const expectedHashBuffer = Buffer.from(expectedHash, 'hex');

    if (computedHash.length !== expectedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(computedHash, expectedHashBuffer);
  }
}
