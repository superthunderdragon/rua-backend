import { prisma } from '@/resources';
import type { Prisma } from '@/prisma';
import type { Request, Response } from 'express';
import { HttpException } from '@/exceptions';
import { addDays, format } from 'date-fns';

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
  const { startTime, endTime, metric, groupBy, aggregationFunc } = req.query;
  if (!groupBy && !aggregationFunc) {
    const metrics = await prisma.lmsMetric.findMany({
      where: {
        userId: req.auth.id,
        metric: metric as Prisma.EnumMetricFilter<'LmsMetric'>,
        ...(startTime && {
          createdAt: { gte: new Date(startTime as string) },
        }),
        ...(endTime && { createdAt: { lte: new Date(endTime as string) } }),
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ metrics });
  }

  if (!groupBy || !aggregationFunc)
    throw new HttpException(
      400,
      'groupBy와 aggregationFunc은 동시에 제공되어야 합니다.'
    );

  const validGroupBy = ['hour', 'day', 'week', 'month', 'year'];
  const validAggFuncs = ['sum', 'avg', 'last', 'first', 'min', 'max', 'count'];

  if (!validGroupBy.includes(groupBy as string))
    throw new HttpException(400, 'groupBy의 값이 올바르지 않습니다.');
  if (!validAggFuncs.includes(aggregationFunc as string))
    throw new HttpException(400, 'aggregationFunc의 값이 올바르지 않습니다.');

  const start = startTime ? new Date(startTime as string) : null;
  const end = endTime ? new Date(endTime as string) : null;

  if (!start || !end) {
    throw new HttpException(400, 'startTime과 endTime을 모두 제공해야 합니다.');
  }

  const metrics = await prisma.lmsMetric.findMany({
    where: {
      userId: req.auth.id,
      metric: metric as Prisma.EnumMetricFilter<'LmsMetric'>,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  function getValueKey(metric: string) {
    switch (metric) {
      case 'studyTime':
        return 'timeMinute';
      case 'formative_evaluation_try':
        return 'score';
      default:
        throw new HttpException(400, '지원하지 않는 metric입니다.');
    }
  }

  const valueKey = getValueKey(metric as string);

  function getGroupKey(date: Date, unit: string) {
    switch (unit) {
      case 'hour':
        return format(date, 'yyyy-MM-dd HH');
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        return format(date, 'yyyy-ww');
      case 'month':
        return format(date, 'yyyy-MM');
      case 'year':
        return format(date, 'yyyy');
      default:
        throw new HttpException(400, 'groupBy의 값이 유효하지 않습니다.');
    }
  }

  const grouped: Record<string, typeof metrics> = {};
  for (const m of metrics) {
    const key = getGroupKey(m.createdAt, groupBy as string);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  function generateGroupKeys(start: Date, end: Date, unit: string): string[] {
    const keys: string[] = [];
    let current = new Date(start);
    while (current <= end) {
      keys.push(getGroupKey(current, unit));
      switch (unit) {
        case 'hour':
          current.setHours(current.getHours() + 1, 0, 0, 0);
          break;
        case 'day':
          current = addDays(current, 1);
          break;
        case 'week':
          current = addDays(current, 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1, 1);
          break;
        case 'year':
          current.setFullYear(current.getFullYear() + 1, 0, 1);
          break;
      }
    }
    return keys;
  }

  const groupKeys = generateGroupKeys(start, end, groupBy as string);

  function aggregate(values: number[], func: string) {
    switch (func) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.length
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null;
      case 'last':
        return values.length ? values[values.length - 1] : null;
      case 'first':
        return values.length ? values[0] : null;
      case 'min':
        return values.length ? Math.min(...values) : null;
      case 'max':
        return values.length ? Math.max(...values) : null;
      case 'count':
        return values.length;
      default:
        throw new HttpException(
          400,
          'aggregationFunc의 값이 유효하지 않습니다.'
        );
    }
  }

  const result = groupKeys.map((key) => {
    const group = grouped[key] || [];
    const values = group
      .map((m) => {
        try {
          const parsed =
            typeof m.value === 'string' ? JSON.parse(m.value) : m.value;
          return Number(parsed?.[valueKey]);
        } catch {
          return null;
        }
      })
      .filter((v) => typeof v === 'number' && !isNaN(v));
    return {
      group: key,
      value: group.length ? aggregate(values, aggregationFunc as string) : null,
    };
  });

  res.json({ metrics: result });
};
