import { env } from '../utils/env';

export const SIGNFLOW_ENCRYPTION_KEY = env('NEXT_PRIVATE_ENCRYPTION_KEY');

export const SIGNFLOW_ENCRYPTION_SECONDARY_KEY = env('NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY');

const keyIsPlaceholder = SIGNFLOW_ENCRYPTION_KEY.startsWith('change-me');

if (typeof window === 'undefined' && !keyIsPlaceholder) {
  if (!SIGNFLOW_ENCRYPTION_KEY || !SIGNFLOW_ENCRYPTION_SECONDARY_KEY) {
    throw new Error('Missing NEXT_PRIVATE_ENCRYPTION_KEY or NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY');
  }

  if (SIGNFLOW_ENCRYPTION_KEY === SIGNFLOW_ENCRYPTION_SECONDARY_KEY) {
    throw new Error('NEXT_PRIVATE_ENCRYPTION_KEY and NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY cannot be equal');
  }
}
