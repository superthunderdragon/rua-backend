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
      createdAt: true,
      id: true,
    },
  });
  res.json({ ...user });
};
