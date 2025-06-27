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
  ],
};
