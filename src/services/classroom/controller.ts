import config from '@/config';
import { HttpException } from '@/exceptions';
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

export const getUnit = async (req: Request, res: Response) => {
  const { unitId } = req.params;
  const unit = await prisma.classroomUnit.findFirst({
    where: { id: unitId },
    select: {
      id: true,
      classroom: true,
      created_at: true,
      description: true,
      title: true,
      updated_at: true,
      Subunits: true,
    },
  });
  if (!unit) throw new HttpException(404, '중단원을 찾을 수 없습니다.');

  res.json({
    ...unit,
  });
};
