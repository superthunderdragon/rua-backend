import { HttpException } from '@/exceptions';
import { NextFunction, Request, Response } from 'express';
import { prisma, verify as verifyToken } from '@/resources';
import { Route, services } from '@/services';

type ServiceName = (typeof services)[number];
export default (service: ServiceName | undefined, route: Route) =>
  async (req: Request, Res: Response, next: NextFunction) => {
    try {
      if (!route.needAuth) return next();

      if (!req.token)
        throw new HttpException(
          401,
          '액세스 토큰이 Authorization 헤더에 Bearer Token Type으로 전송되어야 합니다.'
        );

      const { token } = req;

      const identity = verifyToken(token, route.path === '/refresh');

      if (!identity) throw new HttpException(400, '잘못된 Token입니다.');

      const user = await prisma.user.findFirst({
        where: {
          id: identity.id,
        },
        select: {
          role: true,
        },
      });
      if (!user) throw new HttpException(404, '유저 정보를 찾을 수 없습니다.');
      if (route.onlyTeacher && user.role !== 'teacher')
        throw new HttpException(403, '권한이 부족합니다.');

      req.auth = {
        id: identity.id,
      };
      next();
    } catch (err) {
      return next(err);
    }
  };
