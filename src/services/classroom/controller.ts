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

export const getSubunits = async (req: Request, res: Response) => {
  const { unitId } = req.params;
  const subunits = await prisma.classroomSubunit.findMany({
    where: {
      ClassroomUnit: {
        id: unitId,
      },
    },
  });
  res.json({ subunits });
};

export const getSubunit = async (req: Request, res: Response) => {
  const { subunitId } = req.params;
  const subunit = await prisma.classroomSubunit.findFirst({
    where: {
      id: subunitId,
    },
    select: {
      code: true,
      created_at: true,
      description: true,
      id: true,
      title: true,
      unit_id: true,
      updated_at: true,
      Contents: true,
    },
  });
  if (!subunit) throw new HttpException(404, '소단원을 찾을 수 없습니다.');

  res.json({
    ...subunit,
  });
};

export const getContents = async (req: Request, res: Response) => {
  const { subunitId } = req.params;
  const contents = await prisma.classroomContent.findMany({
    where: {
      ClassroomSubunit: {
        id: subunitId,
      },
    },
  });
  res.json({ contents });
};

export const getContent = async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const content = await prisma.classroomContent.findFirst({
    where: { id: contentId },
  });
  if (!content) throw new HttpException(404, '컨텐츠를 찾을 수 없습니다.');

  res.json({
    ...content,
  });
};
