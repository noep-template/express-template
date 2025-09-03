import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mini Todo API",
      version: "1.0.0",
      description: "API pour gérer des tâches Todo",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "API server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
