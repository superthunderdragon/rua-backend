import { ServiceSchema } from '@/services';
import * as controller from './controller';
import Joi from 'joi';

const MetricDto = {
  id: Joi.string(),
  created_at: Joi.date(),
  updated_at: Joi.date(),
  metric: Joi.string(),
  value: Joi.object(),
  user_id: Joi.string(),
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
          Joi.object().keys({
            timeMinute: Joi.number(),
          }),
          Joi.object().keys({
            score: Joi.number(),
          })
        ),
      },
      response: {
        '200': MetricDto,
      },
    },
    {
      path: '/metric',
      method: 'get',
      needAuth: true,
      handler: controller.getMetrics,
      description: '',
      response: {
        '200': {},
      },
    },
  ],
};
