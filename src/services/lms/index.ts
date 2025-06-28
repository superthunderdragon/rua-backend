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
        metric: Joi.string().valid('studyTime').required(),
        value: Joi.alternatives().try(
          Joi.object({
            timeMinute: Joi.number(),
          }),
          Joi.object({
            score: Joi.number(),
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
      description: '',
      response: {
        '200': {
          result: Joi.number(),
        },
      },
    },
  ],
};
