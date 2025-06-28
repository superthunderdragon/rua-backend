import { ServiceSchema } from '@/services';
import * as controller from './controller';
import Joi from 'joi';

const UnitDto = {
  classroom: Joi.string(),
  id: Joi.string(),
  description: Joi.string(),
  title: Joi.string(),
  created_at: Joi.string(),
  updated_at: Joi.string(),
};
const SubunitDto = {
  id: Joi.string(),
  description: Joi.string(),
  title: Joi.string(),
  code: Joi.string(),
  unit_id: Joi.string(),
  created_at: Joi.string(),
  updated_at: Joi.string(),
};
const ContentDto = {
  id: Joi.string(),
  created_at: Joi.string(),
  updated_at: Joi.string(),
  type: Joi.string(),
  subunit_id: Joi.string(),
  label: Joi.string(),
  body: Joi.string(),
};

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
          units: Joi.array().items(Joi.object(UnitDto)),
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
          ...UnitDto,
          Subunits: Joi.array().items(Joi.object(SubunitDto)),
        },
      },
    },
    {
      path: '/unit/:unitId/subunit',
      method: 'get',
      needAuth: true,
      description: '중단원에 포함된 소단원들을 가져옵니디.',
      handler: controller.getSubunits,
      response: {
        '200': {
          subunits: Joi.array().items(Joi.object(SubunitDto)),
        },
      },
    },
    {
      path: '/subunit/:subunitId',
      method: 'get',
      needAuth: true,
      description: '소단원의 정보를 컨텐츠들의 정보와 함께 가져옵니다.',
      handler: controller.getSubunit,
      response: {
        '200': {
          ...SubunitDto,
          Contents: Joi.array().items(Joi.object(ContentDto)),
        },
      },
    },
    {
      path: '/subunit/:subunitId/content',
      method: 'get',
      needAuth: true,
      description: '소단원에 포함된 컨텐츠들을 가져옵니다.',
      handler: controller.getContents,
      response: {
        '200': {
          contents: Joi.array().items(Joi.object(ContentDto)),
        },
      },
    },
    {
      path: '/content/:contentId',
      method: 'get',
      needAuth: true,
      description: '컨텐츠의 정보를 가져옵니다.',
      handler: controller.getContent,
      response: {
        '200': ContentDto,
      },
    },
  ],
};
