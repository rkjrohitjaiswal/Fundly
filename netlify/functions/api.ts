import serverless from 'serverless-http';
import { app, ensureInitialized } from '../../server/src/app.js';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  await ensureInitialized();
  return serverlessHandler(event, context);
};
