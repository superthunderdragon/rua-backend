import { issue, prisma } from '@/resources';
import type { Request, Response } from 'express';

export const getUserInfo = async (req: Request, res: Response) => {
  const { id } = req.auth;
  const user = await prisma.user.findFirst({
    where: {
      id,
    },
    select: {
      username: true,
      role: true,
      created_at: true,
      id: true,
    },
  });
  res.json({ ...user });
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
