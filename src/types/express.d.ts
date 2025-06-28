import type { User } from '@/prisma';
import express from 'express';

declare global {
  namespace Express {
    interface Request {
      auth?: { id: User['id'] };
    }
  }
}
