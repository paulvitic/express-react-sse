import path from 'path';
import swaggerMiddleware from 'swagger-express-middleware';
import {Application, NextFunction, Request, Response} from 'express';

const apiDocsPath = "/api-explorer/";

export default function (app: Application): Promise<Application> {

  return new Promise((resolve, reject) => {
    swaggerMiddleware(path.join(__dirname, 'api.yml'), app, function(err: Error, swagger) {
      if (err) {
        return reject(err);
      }

      app.use(swagger.metadata());
      app.use(swagger.files(app, {apiPath: process.env.SWAGGER_API_SPEC}));

/*      app.use(swagger.parseRequest({
        // Configure the cookie parser to use secure cookies
        cookie: {
          secret: process.env.SESSION_SECRET
        },
        // Don't allow JSON content over 100kb (default is 1mb)
        json: {
          limit: process.env.REQUEST_LIMIT
        }
      }));*/

      // These two middleware don't have any options (yet)
      app.use(
          swagger.CORS(),
          swagger.validateRequest());

      resolve(app);
    });
  });
}
