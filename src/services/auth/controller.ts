import type { Request, Response } from 'express';
import { issue, prisma } from '@/resources';
import { HttpException } from '@/exceptions';
import { UserRole } from '@/prisma';

export const signIn = async (req: Request, res: Response) => {
  const { kakaoUid, username } = req.body;
  const { role } = req.params;
  if (!['student', 'teacher'].includes(role))
    throw new HttpException(401, '권한이 잘못되었습니다.');
  const user = await prisma.user.findFirst({
    where: { kakao_uid: kakaoUid },
  });
  if (!user) {
    const createUser = await prisma.user.create({
      data: {
        kakao_uid: kakaoUid,
        username,
        role: role as UserRole,
      },
    });
    res.json({
      access_token: issue(createUser),
      refresh_token: issue(createUser, true),
    });
    return;
  }
  res.json({
    access_token: issue(user),
    refresh_token: issue(user, true),
  });
};
