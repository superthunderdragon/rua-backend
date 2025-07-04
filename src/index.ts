import dotenv from 'dotenv';
import App from './app';
import config from './config';
import { logger } from './resources';

dotenv.config();

// default port: 3000
const port: number = parseInt(config.port) || 3000;
const { app } = new App();

app
  .listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  })
  .on('error', (error) => {
    logger.error(error);
  });
