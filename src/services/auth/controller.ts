import type { Request, Response } from 'express';
import { issue, prisma } from '@/resources';
import { HttpException } from '@/exceptions';
import { UserRole } from '@/prisma';
import config from '@/config';

export const signIn = async (req: Request, res: Response) => {
  const { kakaoUid, username } = req.body;
  const { role } = req.params;
  if (!['student', 'teacher'].includes(role))
    throw new HttpException(401, '권한이 잘못되었습니다.');
  const user = await prisma.user.findFirst({
    where: { kakaoUid },
  });
  if (!user) {
    const createUser = await prisma.user.create({
      data: {
        kakaoUid,
        username,
        role: role as UserRole,
      },
    });

    // default classroom
    const classroom = await prisma.classroom.findFirst({
      where: { name: config.demoClassroom },
    });
    if (classroom)
      await prisma.classroomUser.create({
        data: {
          classroom: classroom.id,
          user: createUser.id,
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

export const refresh = async (req: Request, res: Response) => {
  const { id } = req.auth;
  const user = await prisma.user.findFirst({
    where: { id },
  });
  res.json({
    access_token: issue(user),
    refresh_token: issue(user, true),
  });
};
