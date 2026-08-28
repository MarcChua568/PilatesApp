import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Shared runtime config used by both the local server (main.ts) and the
 *  serverless handler (api/index.ts). */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
  });
}
