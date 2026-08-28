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
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { AppModule } from '../dist/app.module';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { configureApp } from '../dist/setup';

let appPromise: Promise<express.Express> | undefined;

async function build() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn'] },
  );
  configureApp(app);
  await app.init();
  return expressApp;
}

// Vercel's Node runtime calls this with plain (req, res), same signature an
// Express app already implements — no Lambda-event adapter needed.
export default async function handler(req: unknown, res: unknown) {
  if (!appPromise) appPromise = build();
  const expressApp = await appPromise;
  return (expressApp as unknown as (req: unknown, res: unknown) => unknown)(req, res);
}
