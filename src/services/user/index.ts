import { ServiceSchema } from '@/services';
import * as controller from './controller';
import Joi from 'joi';

export default <ServiceSchema>{
  baseURL: '/user',
  name: 'user',
  routes: [
    {
      path: '/me',
      method: 'get',
      needAuth: true,
      handler: controller.getUserInfo,
      description: '자신의 정보를 가져옵니다.',
      response: {
        '200': {
          id: Joi.string(),
          username: Joi.string(),
          role: Joi.string(),
          createdAt: Joi.date(),
        },
      },
    },
  ],
};
