import type { User } from '@/prisma';
import jwt from 'jsonwebtoken';
import { HttpException } from '@/exceptions';
import config from '@/config';

export const verify = (token?: string, refresh?: boolean) => {
  if (!token) return null;
  try {
    const { identity } = jwt.verify(
      token,
      refresh ? config.jwtRefreshSecret : config.jwtSecret
    ) as {
      identity: {
        id: string;
      };
    };
    return identity;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new HttpException(401, '토큰이 만료되었습니다.');
    } else if (['jwt malformed', 'invalid signature'].includes(error.message)) {
      throw new HttpException(401, '토큰이 변조되었습니다.');
    } else throw new HttpException(401, '토큰에 문제가 있습니다.');
  }
};

export const issue = (identity: User, refresh?: boolean) => {
  const token = jwt.sign(
    {
      identity: {
        id: identity.id,
      },
    },
    refresh ? config.jwtRefreshSecret : config.jwtSecret,
    {
      algorithm: 'HS512',
      expiresIn: refresh ? '1y' : '12h',
    }
  );
  return token;
};
