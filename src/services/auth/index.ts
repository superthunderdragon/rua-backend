import type { ServiceSchema } from '@/services';
import * as controller from './controller';
import Joi from 'joi';

export default <ServiceSchema>{
  name: 'auth',
  baseURL: '/auth',
  routes: [
    {
      method: 'post',
      path: '/:role',
      description: 'role은 student또는 teacher입니다.',
      needAuth: false,
      validateSchema: {
        kakaoUid: Joi.string().required(),
        username: Joi.string().required(),
      },
      handler: controller.signIn,
      response: {
        "200": {
          access_token: Joi.string(),
          refresh_token: Joi.string(),
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
