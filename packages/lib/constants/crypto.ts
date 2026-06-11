import { env } from '../utils/env';

export const SIGNFLOW_ENCRYPTION_KEY = env('NEXT_PRIVATE_ENCRYPTION_KEY');

export const SIGNFLOW_ENCRYPTION_SECONDARY_KEY = env('NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY');

// if (typeof window === 'undefined') {
//   if (!SIGNFLOW_ENCRYPTION_KEY || !SIGNFLOW_ENCRYPTION_SECONDARY_KEY) {
//     throw new Error('Missing SIGNFLOW_ENCRYPTION_KEY or SIGNFLOW_ENCRYPTION_SECONDARY_KEY keys');
//   }

//   if (SIGNFLOW_ENCRYPTION_KEY === SIGNFLOW_ENCRYPTION_SECONDARY_KEY) {
//     throw new Error(
//       'SIGNFLOW_ENCRYPTION_KEY and SIGNFLOW_ENCRYPTION_SECONDARY_KEY cannot be equal',
//     );
//   }
// }

// if (SIGNFLOW_ENCRYPTION_KEY === 'CAFEBABE') {
//   console.warn('*********************************************************************');
//   console.warn('*');
//   console.warn('*');
//   console.warn('Please change the encryption key from the default value of "CAFEBABE"');
//   console.warn('*');
//   console.warn('*');
//   console.warn('*********************************************************************');
// }
