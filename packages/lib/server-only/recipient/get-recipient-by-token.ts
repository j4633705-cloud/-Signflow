import { prisma } from '@signflow/prisma';

export interface GetRecipientByTokenOptions {
  token: string;
}

export const getRecipientByToken = async ({ token }: GetRecipientByTokenOptions) => {
  return await prisma.recipient.findFirstOrThrow({
    where: {
      token,
    },
    include: {
      fields: true,
    },
  });
};
