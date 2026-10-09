import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';

try {
  await connectDatabase(env.MONGO_URI);
  app.listen(env.PORT, () => console.info(`College Department API listening on port ${env.PORT}`));
} catch (error) {
  console.error('Could not start the API. Check database connectivity and required environment configuration.', { name: error.name, code: error.code });
  process.exit(1);
}