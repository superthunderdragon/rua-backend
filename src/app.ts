import express from 'express';

import cors from 'cors';
import bearerToken from 'express-bearer-token';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middlewares';
import { routers, serviceRouter, ServiceSchema } from './services';
import { OpenAPIV3 } from 'openapi-types';
import Joi from 'joi';
import { prisma } from './resources';
import config from './config';

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
        info: { title: 'LUA_API', version: '1.0.0' },
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
    const type = joiSchema.type;
    switch (type) {
      case 'string':
        return { type: 'string' };
      case 'number':
        return { type: 'number' };
      case 'boolean':
        return { type: 'boolean' };
      case 'array':
        const items = joiSchema['$_terms'].items[0];
        return {
          type: 'array',
          items: items
            ? this.joiSchemaToOpenAPISchema(items)
            : { type: 'string' },
        };
      case 'object':
        const keys = joiSchema['$_terms']?.keys || [];
        return {
          type: 'object',
          properties: Object.fromEntries(
            keys.map((key: any) => [
              key.key,
              this.joiSchemaToOpenAPISchema(key.schema),
            ])
          ),
          required: keys
            .filter((key: any) => key.schema._flags?.presence === 'required')
            .map((key: any) => key.key),
        };
      default:
        return { type: 'string' };
    }
  }
}

export default App;
