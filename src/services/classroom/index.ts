import { ServiceSchema } from '@/services';
import * as controller from './controller';
import Joi from 'joi';

export default <ServiceSchema>{
  baseURL: '/classroom',
  name: 'classroom',
  routes: [
    {
      path: '/unit',
      method: 'get',
      needAuth: true,
      description: '모든 중단원들을 가져옵니다.',
      handler: controller.getUnits,
      response: {
        '200': {
          units: Joi.array().items(
            Joi.object({
              classroom: Joi.string(),
              id: Joi.string(),
              description: Joi.string(),
              title: Joi.string(),
              created_at: Joi.string(),
              updated_at: Joi.string(),
            })
          ),
        },
      },
    },
    {
      path: '/unit/:unitId',
      method: 'get',
      needAuth: true,
      description: '중단원의 정보를 소단원들의 정보와 함께 가져옵니다.',
      handler: controller.getUnit,
      response: {
        '200': {
          id: Joi.string(),
          classroom: Joi.string(),
          description: Joi.string(),
          title: Joi.string(),
          created_at: Joi.string(),
          updated_at: Joi.string(),
          Subunits: Joi.array().items(
            Joi.object({
              id: Joi.string(),
              description: Joi.string(),
              title: Joi.string(),
              code: Joi.string(),
              unit_id: Joi.string(),
              created_at: Joi.string(),
              updated_at: Joi.string(),
            })
          ),
        },
      },
    },
  ],
};
