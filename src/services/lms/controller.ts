import { prisma } from '@/resources';
import type { Request, Response } from 'express';

export const createMetric = async (req: Request, res: Response) => {
  const { metric, value } = req.body;
  const metricData = await prisma.lmsMetric.create({
    data: {
      metric,
      value,
      userId: req.auth.id,
    },
  });
  res.json({ ...metricData });
};

export const getMetrics = async (req: Request, res: Response) => {
  const { startTime, endTime, groupBy, aggregationFunc } = req.query;
  if (!groupBy && !aggregationFunc) {
    // Raw metric data
    const metrics = await prisma.lmsMetric.findMany({
      where: {
        userId: req.auth.id,
        ...(startTime && {
          createdAt: { gte: new Date(startTime as string) },
        }),
        ...(endTime && { createdAt: { lte: new Date(endTime as string) } }),
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(metrics);
  }

  if (!groupBy || !aggregationFunc) {
    return res
      .status(400)
      .json({
        error: 'Both groupBy and aggregationFunc must be provided together.',
      });
  }

  const validGroupBy = ['hour', 'day', 'week', 'month', 'year'];
  const validAggFuncs = ['sum', 'avg', 'last', 'first', 'min', 'max', 'count'];

  if (!validGroupBy.includes(groupBy as string)) {
    return res.status(400).json({ error: 'Invalid groupBy value.' });
  }
  if (!validAggFuncs.includes(aggregationFunc as string)) {
    return res.status(400).json({ error: 'Invalid aggregationFunc value.' });
  }

  // Build date format string for grouping
  const groupByFormat: Record<string, string> = {
    hour: '%Y-%m-%d %H:00:00',
    day: '%Y-%m-%d',
    week: '%Y-%u',
    month: '%Y-%m',
    year: '%Y',
  };

  const dateFormat = groupByFormat[groupBy as string];

  // Raw SQL for grouping and aggregation
  const aggFuncSql: Record<string, string> = {
    sum: 'SUM(value)',
    avg: 'AVG(value)',
    last: 'LAST_VALUE(value) OVER w',
    first: 'FIRST_VALUE(value) OVER w',
    min: 'MIN(value)',
    max: 'MAX(value)',
    count: 'COUNT(*)',
  };

  const selectValue = aggFuncSql[aggregationFunc as string];

  const metrics = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      DATE_FORMAT(created_at, '${dateFormat}') as group_time,
      ${selectValue} as value
    FROM lms_metric
    WHERE user_id = ?
      ${startTime ? 'AND created_at >= ?' : ''}
      ${endTime ? 'AND created_at <= ?' : ''}
    GROUP BY group_time
    ORDER BY group_time ASC
  `,
    ...(startTime && endTime
      ? [req.auth.id, startTime, endTime]
      : startTime
      ? [req.auth.id, startTime]
      : endTime
      ? [req.auth.id, endTime]
      : [req.auth.id])
  );

  res.json(metrics);
};
