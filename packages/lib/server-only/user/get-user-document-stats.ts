import { kyselyPrisma, prisma, sql } from '@signflow/prisma';
import { DateTime } from 'luxon';

export const getUserDocumentStats = async (userId: number) => {
  const counts = await prisma.envelope.groupBy({
    where: {
      userId,
    },
    by: ['status'],
    _count: { _all: true },
  });

  const stats: Record<string, number> = {
    DRAFT: 0,
    PENDING: 0,
    COMPLETED: 0,
    REJECTED: 0,
    TOTAL: 0,
  };

  counts.forEach((c) => {
    stats[c.status] = c._count._all;
    stats.TOTAL += c._count._all;
  });

  return stats;
};

export const getUserMonthlyDocumentTrend = async (userId: number) => {
  const sixMonthsAgo = DateTime.now().minus({ months: 6 }).startOf('month').toJSDate();

  const qb = kyselyPrisma.$kysely
    .selectFrom('Envelope')
    .select(({ fn }) => [
      fn<Date>('DATE_TRUNC', [sql.lit('MONTH'), 'createdAt']).as('month'),
      fn.count('id').as('count'),
    ])
    .where('userId', '=', userId)
    .where('createdAt', '>=', sixMonthsAgo)
    .groupBy(fn('DATE_TRUNC', [sql.lit('MONTH'), 'createdAt']))
    .orderBy('month', 'asc');

  const result = await qb.execute();

  return result.map((row) => ({
    month: DateTime.fromJSDate(row.month as Date).toFormat('yyyy-MM'),
    count: Number(row.count),
  }));
};

export type TUserDocumentStats = Awaited<ReturnType<typeof getUserDocumentStats>>;
export type TUserMonthlyDocumentTrend = Awaited<ReturnType<typeof getUserMonthlyDocumentTrend>>;
