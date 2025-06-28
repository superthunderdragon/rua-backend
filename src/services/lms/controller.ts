import { dayjs, prisma, toLocalDatetimeString } from '@/resources';
import type { Metric, Prisma } from '@/prisma';
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
    select: {
      id: true,
      metric: true,
      userId: true,
      value: true,
    },
  });
  res.json({ ...metricData });
};

/**
 * @function getMetrics
 * @async
 * @param req - Express의 Request 객체로, 쿼리 파라미터(startTime, endTime, metric, groupBy, aggregationFunc)와 인증 정보를 포함합니다.
 * @param res - Express의 Response 객체로, 결과를 JSON 형태로 반환합니다.
 *
 * 사용자의 메트릭 데이터를 조회하는 컨트롤러 함수입니다.
 *
 * - groupBy와 aggregationFunc가 없는 경우, 단순히 조건에 맞는 메트릭 리스트를 반환합니다.
 * - groupBy와 aggregationFunc가 모두 제공된 경우, 주어진 기간 내에서 지정된 단위(시간, 일, 주, 월, 년)로 데이터를 그룹화하고,
 *   지정된 집계 함수(합계, 평균, 마지막 값, 첫 값, 최소, 최대, 개수)를 적용하여 결과를 반환합니다.
 *
 * 지원하는 groupBy 값: 'hour', 'day', 'week', 'month', 'year'
 * 지원하는 aggregationFunc 값: 'sum', 'avg', 'last', 'first', 'min', 'max', 'count'
 *
 * startTime과 endTime이 모두 제공되어야 하며, metric에 따라 집계에 사용할 value의 키가 달라집니다.
 *
 * @throws {HttpException} 잘못된 파라미터나 지원하지 않는 값이 입력된 경우 400 에러를 발생시킵니다.
 *
 * @returns {void} 결과는 res.json({ metrics }) 형태로 반환됩니다.
 */
const getMetrics = async ({
  startTime,
  endTime,
  metric,
  groupBy,
  aggregationFunc,
  userId,
}: {
  startTime: string;
  endTime: string;
  metric: Metric;
  groupBy: 'hour' | 'day' | 'week' | 'month' | 'year';
  aggregationFunc: 'sum' | 'avg' | 'last' | 'first' | 'min' | 'max';
  userId: string;
}) => {
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

  const toUTC = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  };

  const start = startTime ? toUTC(startTime as string) : null;
  const end = endTime ? toUTC(endTime as string) : null;

  if (!start || !end) {
    throw new HttpException(400, 'startTime과 endTime을 모두 제공해야 합니다.');
  }

  const metrics = await prisma.lmsMetric.findMany({
    where: {
      userId,
      metric: metric as Prisma.EnumMetricFilter<'LmsMetric'>,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  function toKST(date: Date): Date {
    return dayjs(date).add(9, 'hour').toDate();
  }

  const grouped: Record<string, typeof metrics> = {};
  for (const m of metrics) {
    const kstDate = toKST(m.createdAt);
    const key = getGroupKey(kstDate, groupBy as string);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }
  function getValueKey(metric: Metric) {
    switch (metric) {
      case 'studyTime':
        return 'timeMinute';
      case 'correct':
        return 'score';
      case 'progress':
        return 'progress';
      default:
        throw new HttpException(400, '지원하지 않는 metric입니다.');
    }
  }

  const valueKey = getValueKey(metric);

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

  return result;
};

export const getAttendance = async (req: Request, res: Response) => {
  const { startTime } = req.query;

  const result = await getMetrics({
    aggregationFunc: 'last',
    startTime: toLocalDatetimeString(
      dayjs(startTime as string)
        .day(0)
        .startOf('day')
        .toDate()
    ),
    endTime: toLocalDatetimeString(
      dayjs(startTime as string)
        .day(6)
        .endOf('day')
        .toDate()
    ),
    groupBy: 'day',
    metric: 'studyTime',
    userId: req.auth.id,
  });
  res.json({
    result: result.filter((r) => !!r.value).map((r) => r.group),
  });
};

export const getStudyTime = async (req: Request, res: Response) => {
  const result = await getMetrics({
    aggregationFunc: 'sum',
    startTime: toLocalDatetimeString(dayjs().startOf('year').toDate()),
    endTime: toLocalDatetimeString(new Date()),
    groupBy: 'year',
    metric: 'studyTime',
    userId: req.auth.id,
  });
  res.json({ result: result[0].value ? result[0].value : 0 });
};

export const getProgress = async (req: Request, res: Response) => {
  const subunits = await prisma.classroomSubunit.findMany({
    select: {
      id: true,
    },
  });
  const metrics = await prisma.lmsMetric.findMany({
    where: {
      userId: req.auth.id,
      metric: 'progress',
    },
  });
  const subunitIds: Array<string> = [];
  for (const metric of metrics) {
    console.log(metric.value);
    console.log(typeof metric.value);
    if (typeof metric.value !== 'string') continue;
    const progressId = JSON.parse(metric.value).progress;
    if (!subunitIds.includes(progressId)) subunitIds.push(progressId);
  }
  res.json({
    result: Math.floor((subunitIds.length / subunits.length) * 100),
  });
};

export const getCorrect = async (req: Request, res: Response) => {
  const result = await getMetrics({
    aggregationFunc: 'sum',
    startTime: toLocalDatetimeString(dayjs().startOf('year').toDate()),
    endTime: toLocalDatetimeString(new Date()),
    groupBy: 'year',
    metric: 'correct',
    userId: req.auth.id,
  });
  const tests = await prisma.lmsMetric.findMany({
    where: {
      userId: req.auth.id,
      metric: 'correct',
    },
    select: {
      id: true,
    },
  });
  res.json({
    result: Math.floor(
      ((result[0].value ? result[0].value : 0) / tests.length) * 100
    ),
  });
};
