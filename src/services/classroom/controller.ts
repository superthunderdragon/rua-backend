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
    select: {
      classroom: true,
      description: true,
      id: true,
      title: true,
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
      description: true,
      title: true,
      Subunits: true,
    },
  });
  if (!unit) throw new HttpException(404, '중단원을 찾을 수 없습니다.');

  res.json(unit);
};

export const createUnit = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const classroom = await prisma.classroom.findFirst({
    where: { name: config.demoClassroom },
    select: {
      id: true,
    },
  });
  const unit = await prisma.classroomUnit.create({
    data: {
      title,
      classroom: classroom.id,
      description,
    },
    select: {
      classroom: true,
      description: true,
      id: true,
      title: true,
    },
  });
  res.json(unit);
};

export const getSubunits = async (req: Request, res: Response) => {
  const { unitId } = req.params;
  const subunits = await prisma.classroomSubunit.findMany({
    where: {
      ClassroomUnit: {
        id: unitId,
      },
    },
    select: {
      code: true,
      description: true,
      id: true,
      title: true,
      unitId: true,
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
      description: true,
      id: true,
      title: true,
      unitId: true,
      Contents: {
        orderBy: {
          label: 'asc',
        },
      },
    },
  });
  if (!subunit) throw new HttpException(404, '소단원을 찾을 수 없습니다.');

  res.json(subunit);
};

export const createSubunit = async (req: Request, res: Response) => {
  const { unitId } = req.params;
  const { title, description, code } = req.body;
  const subunit = await prisma.classroomSubunit.create({
    data: {
      code,
      title,
      description,
      unitId,
    },
    select: {
      code: true,
      description: true,
      id: true,
      title: true,
      unitId: true,
    },
  });
  res.json(subunit);
};

export const getContents = async (req: Request, res: Response) => {
  const { subunitId } = req.params;
  const contents = await prisma.classroomContent.findMany({
    where: {
      ClassroomSubunit: {
        id: subunitId,
      },
    },
    orderBy: {
      label: 'asc',
    },
    select: {
      body: true,
      id: true,
      label: true,
      subunitId: true,
      type: true,
    },
  });
  res.json({ contents });
};

export const getContent = async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const content = await prisma.classroomContent.findFirst({
    where: { id: contentId },
    select: {
      body: true,
      id: true,
      label: true,
      subunitId: true,
      type: true,
    },
  });
  if (!content) throw new HttpException(404, '컨텐츠를 찾을 수 없습니다.');

  res.json(content);
};

export const createContent = async (req: Request, res: Response) => {
  const { subunitId } = req.params;
  const { type, label, body } = req.body;

  const content = await prisma.classroomContent.create({
    data: {
      body,
      label,
      type,
      subunitId,
    },
    select: {
      body: true,
      id: true,
      label: true,
      subunitId: true,
      type: true,
    },
  });
  res.json(content);
};
