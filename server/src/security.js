import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const SCRYPT_OPTS = { N: 1 << 14, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** 房间密码：加盐 scrypt，只存在服务器内存里，从不下发给任何客户端 */
export async function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = await scrypt(String(plain), salt, 32, SCRYPT_OPTS);
  return { salt, hash };
}

export async function verifyPassword(plain, rec) {
  if (!rec) return true;
  const hash = await scrypt(String(plain ?? ''), rec.salt, 32, SCRYPT_OPTS);
  return timingSafeEqual(hash, rec.hash);
}

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆的 I/O/0/1
export function randomCode(len = 6, alphabet = ROOM_ALPHABET) {
  let s = '';
  for (let i = 0; i < len; i++) s += alphabet[randomInt(alphabet.length)];
  return s;
}

export const newPeerId = () => 'P_' + randomCode(8);
export const newToken = () => randomBytes(24).toString('base64url');
export const coinFlip = () => randomInt(2);

/** 令牌桶限流 */
export class TokenBucket {
  constructor(capacity, refillPerSec) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refill = refillPerSec;
    this.last = Date.now();
  }
  take(n = 1) {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.refill);
    this.last = now;
    if (this.tokens < n) return false;
    this.tokens -= n;
    return true;
  }
}
