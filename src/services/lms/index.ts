import { ServiceSchema } from '@/services';
import * as controller from './controller';
import Joi from 'joi';

const MetricDto = {
  id: Joi.string(),
  metric: Joi.string(),
  value: Joi.object(),
  userId: Joi.string(),
};

export default <ServiceSchema>{
  baseURL: '/lms',
  name: 'lms',
  routes: [
    {
      path: '/metric',
      method: 'post',
      needAuth: true,
      handler: controller.createMetric,
      description: 'Metric을 생성합니다.',
      validateSchema: {
        metric: Joi.string()
          .valid('studyTime', 'correct', 'progress')
          .required(),
        value: Joi.alternatives().try(
          Joi.object({
            timeMinute: Joi.number(),
          }),
          Joi.object({
            score: Joi.number(),
          }),
          Joi.object({
            progress: Joi.string(),
          })
        ),
      },
      response: {
        '200': MetricDto,
      },
    },
    {
      path: '/attendance',
      method: 'get',
      needAuth: true,
      handler: controller.getAttendance,
      description: '출석 현황을 가져옵니다.',
      response: {
        '200': {
          result: Joi.number(),
        },
      },
    },
    {
      path: '/studyTime',
      method: 'get',
      needAuth: true,
      handler: controller.getStudyTime,
      description: '총 학습 시간을 가져옵니다.',
      response: {
        '200': {
          result: Joi.number(),
        },
      },
    },
    {
      path: '/progress',
      method: 'get',
      needAuth: true,
      handler: controller.getProgress,
      description: '학습 진행률을 가져옵니다.',
      response: {
        '200': {
          result: Joi.number(),
        },
      },
    },
  ],
};
