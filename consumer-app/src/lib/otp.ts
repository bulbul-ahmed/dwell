import { createHash, randomInt } from 'crypto';

export function generateOTP(): string {
  return String(randomInt(100000, 999999));
}

export function hashOTP(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
