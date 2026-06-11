import { encryptEmailTransportConfig } from '@signflow/lib/server-only/email/email-transport-config';
import { generateDatabaseId } from '@signflow/lib/universal/id';
import { prisma } from '@signflow/prisma';

import { adminProcedure } from '../../trpc';
import {
  ZCreateEmailTransportRequestSchema,
  ZCreateEmailTransportResponseSchema,
} from './create-email-transport.types';

export const createEmailTransportRoute = adminProcedure
  .input(ZCreateEmailTransportRequestSchema)
  .output(ZCreateEmailTransportResponseSchema)
  .mutation(async ({ input }) => {
    const { name, fromName, fromAddress, config } = input;

    const transport = await prisma.emailTransport.create({
      data: {
        id: generateDatabaseId('email_transport'),
        name,
        type: config.type,
        fromName,
        fromAddress,
        config: encryptEmailTransportConfig(config),
      },
      select: { id: true },
    });

    return {
      id: transport.id,
    };
  });
