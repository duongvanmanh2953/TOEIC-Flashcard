import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'IDEMPOTENT_META';

export interface IdempotentOptions {
  ttlSeconds?: number;
  lockUser?: boolean;
}

export const Idempotent = (options: IdempotentOptions = { ttlSeconds: 120, lockUser: true }) =>
  SetMetadata(IDEMPOTENT_KEY, options);
