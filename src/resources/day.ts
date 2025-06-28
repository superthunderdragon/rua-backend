import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.locale('ko');

export const timeFromNow = (date: Date): string => dayjs(date).fromNow();
export const formatDate = (date: Date): string => dayjs(date).format('M월 D일');
export const getFullTime = (date: Date): string =>
  dayjs(date).format('M월 D일 A h시 m분').replace('AM', '오전').replace('PM', '오후');
export const getDiffDay = (date: Date): number => dayjs().diff(date, 'day');
export const diagnosisDate = (date: Date): string => dayjs(date).format('YYYY년 M월 D일 HH:mm');

export const toLocalDatetimeString = (date: Date): string => {
  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const calculWeek = (addWeek: number): Array<dayjs.Dayjs> => {
  const cloneDay = dayjs().clone().add(addWeek, 'week');
  const result = [];
  for (let i = 1; i <= 7; i++) {
    const day = dayjs(cloneDay).day(i);
    result.push(day);
  }

  return result;
};
export const getCalculWeek = (
  addWeek: number,
): {
  month: number;
  week: number;
} => {
  const cloneDay = dayjs().clone().add(addWeek, 'week');
  const startOfMonth = cloneDay.startOf('month');
  const currentWeek = cloneDay.week();
  const startWeek = startOfMonth.week();

  let weekOfMonth = currentWeek - startWeek + 1;

  if (startWeek > currentWeek) weekOfMonth = currentWeek + 1;

  return {
    month: cloneDay.month() + 1,
    week: weekOfMonth,
  };
};

export const minuteToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  return `${hours > 0 ? `${hours}시간 ` : ''}${minutes % 60}분`;
};

export default dayjs;
