import type { User } from '@prisma/client';

import { SIGNFLOW_ENCRYPTION_KEY } from '../../constants/crypto';

type IsTwoFactorAuthenticationEnabledOptions = {
  user: User;
};

export const isTwoFactorAuthenticationEnabled = ({ user }: IsTwoFactorAuthenticationEnabledOptions) => {
  return user.twoFactorEnabled && typeof SIGNFLOW_ENCRYPTION_KEY === 'string';
};
