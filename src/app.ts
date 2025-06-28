import express from 'express';

import cors from 'cors';
import bearerToken from 'express-bearer-token';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middlewares';
import { routers, serviceRouter, ServiceSchema } from './services';
import { OpenAPIV3 } from 'openapi-types';
import j2s from 'joi-to-swagger';
import Joi from 'joi';
import { prisma } from './resources';
import config from './config';

/**
 * @class App
 * @description
 * Express 애플리케이션의 초기화, 미들웨어, 라우터, 에러 핸들러, 데모 데이터 생성을 담당하는 클래스입니다.
 * 
 * - `initializeMiddlewares`: 보안, CORS, JSON 파싱, Bearer 토큰 인증 등 주요 미들웨어를 등록합니다.
 * - `initializeRouter`: 서비스 라우터와 Swagger 문서 라우터를 등록합니다.
 * - `initializeErrorHandlers`: 글로벌 에러 핸들러를 등록합니다.
 * - `createDemo`: 데모용 Classroom 데이터가 없을 경우 생성합니다.
 * - `convertRoutesToSwagger`: 서비스 스키마를 OpenAPI 3.0 형식의 Swagger Paths 객체로 변환합니다.
 * - `joiSchemaToOpenAPISchema`: Joi 스키마를 OpenAPI 스키마로 변환합니다.
 * 
 * @property {express.Application} app Express 애플리케이션 인스턴스
 */
class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRouter();
    this.initializeErrorHandlers();
    this.createDemo();
  }

  private initializeRouter() {
    this.app.use('/', serviceRouter);
    this.app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup({
        openapi: '3.0.0',
        info: { title: 'RUA_API', version: '1.0.0' },
        paths: this.convertRoutesToSwagger(routers),
      })
    );
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(
      express.json({
        limit: '20mb',
      })
    );
    this.app.use(
      bearerToken({
        headerKey: 'Bearer',
        reqKey: 'token',
      })
    );
  }

  private initializeErrorHandlers() {
    this.app.use(errorHandler);
  }

  private async createDemo() {
    const classroom = await prisma.classroom.findFirst({
      where: {
        name: config.demoClassroom,
      },
    });
    if (!classroom)
      await prisma.classroom.create({
        data: {
          name: config.demoClassroom,
        },
      });
  }

  private convertRoutesToSwagger(
    services: ServiceSchema[]
  ): OpenAPIV3.PathsObject {
    // ServiceSchema에 맞춰 OpenAPI 형식을 자동 전환합니다.
    const paths: OpenAPIV3.PathsObject = {};

    for (const service of services) {
      for (const route of service.routes) {
        const fullPath = (service.baseURL + route.path).replace(
          /:([a-zA-Z0-9_]+)/g,
          '{$1}'
        );

        const paramMatches = [...route.path.matchAll(/:([a-zA-Z0-9_]+)/g)];
        const parameters: OpenAPIV3.ParameterObject[] = paramMatches.map(
          (match) => ({
            name: match[1],
            in: 'path',
            required: true,
            schema: { type: 'string' },
          })
        );

        const requestBody: OpenAPIV3.RequestBodyObject | undefined =
          route.validateSchema
            ? {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: Object.fromEntries(
                        Object.entries(route.validateSchema).map(
                          ([key, schema]) => {
                            return [key, this.joiSchemaToOpenAPISchema(schema)];
                          }
                        )
                      ),
                      required: Object.entries(route.validateSchema)
                        .filter(
                          ([_, schema]) =>
                            schema._flags?.presence === 'required'
                        )
                        .map(([key]) => key),
                    },
                  },
                },
              }
            : undefined;

        const responses = Object.fromEntries(
          Object.entries(route.response).map(([statusCode, schema]) => [
            statusCode,
            {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: Object.fromEntries(
                      Object.entries(schema).map(([key, s]) => [
                        key,
                        this.joiSchemaToOpenAPISchema(s as Joi.Schema),
                      ])
                    ),
                  },
                },
              },
            },
          ])
        );

        paths[fullPath] = {
          ...(paths[fullPath] || {}),
          [route.method]: {
            description: route.description,
            tags: [service.name],
            security: route.needAuth ? [{ bearerAuth: [] }] : [],
            requestBody,
            responses,
            parameters,
          },
        };
      }
    }

    return paths;
  }

  private joiSchemaToOpenAPISchema(
    joiSchema: Joi.Schema
  ): OpenAPIV3.SchemaObject {
    return j2s(joiSchema).swagger;
  }
}

export default App;
