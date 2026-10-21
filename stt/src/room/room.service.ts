import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

@Injectable()
export class RoomService {
  private rooms = new Set<string>();
  create(existing?: string): string {
    if (existing && this.rooms.has(existing)) return existing;
    let code: string;
    do {
      code = Array.from(
        { length: 6 },
        () => ALPHABET[randomInt(ALPHABET.length)],
      ).join('');
    } while (this.rooms.has(code));
    this.rooms.add(code);
    return code;
  }

  exists(code: string): boolean {
    return this.rooms.has(code);
  }
}
