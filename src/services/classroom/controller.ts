import config from '@/config';
import { prisma } from '@/resources';
import type { Request, Response } from 'express';

export const getUnits = async (req: Request, res: Response) => {
  const units = await prisma.classroomUnit.findMany({
    where: {
      Classroom: {
        name: config.demoClassroom,
      },
    },
  });
  res.json({ units });
};
