import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  url: process.env.APP_URL || 'http://localhost',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
}));
