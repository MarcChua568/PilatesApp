/**
 * Vercel serverless entrypoint. Boots Nest once per warm instance and reuses it.
 *
 * It imports the *compiled* app from ../dist (produced by `npm run build` in
 * vercel.json's buildCommand) rather than ../src, because Vercel's function
 * bundler does not emit TypeScript decorator metadata and NestJS DI needs it.
 */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { AppModule } from '../dist/app.module';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { configureApp } from '../dist/setup';

let handlerPromise: Promise<ReturnType<typeof serverlessExpress>> | undefined;

async function build() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn'] },
  );
  configureApp(app);
  await app.init();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(req: unknown, res: unknown) {
  if (!handlerPromise) handlerPromise = build();
  const h = await handlerPromise;
  return (h as (req: unknown, res: unknown) => unknown)(req, res);
}
