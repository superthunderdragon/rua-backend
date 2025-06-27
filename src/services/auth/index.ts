import type { ServiceSchema } from '@/services';
import * as controllers from './controller';
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
      handler: controllers.signIn,
      response: {
        "200": {
          access_token: Joi.string(),
          refresh_token: Joi.string(),
        },
      },
    },
  ],
};
