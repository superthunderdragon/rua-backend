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
          created_at: Joi.date(),
        },
      },
    },
    {
      path: '/refresh',
      method: 'get',
      needAuth: true,
      handler: controller.refresh,
      description: '리프레시 토큰으로 새로운 토큰을 재발급합니다.',
      response: {
        '200': {
          access_token: Joi.string(),
          refresh_token: Joi.string(),
        },
      },
    },
  ],
};
