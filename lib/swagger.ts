import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Going Merry Hospital Management System API',
        version: '1.0.0',
        description: 'RESTful Clinical Operations API conforming to Master Engineering PRD and SOW Specifications.',
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          description: 'Local / Staging Environment',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });
  return spec;
};
