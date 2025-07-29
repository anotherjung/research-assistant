
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { researchWorkflow } from './workflows/research-workflow';
import { weatherAgent } from './agents/weather-agent';

import { PgVector } from '@mastra/pg';
import { researchAgent } from './agents/research-agent';

const pgVectorStore = new PgVector({
  connectionString: process.env.POSTGRES_CONNECTION_STRING!, //! for trustme
});

export const mastra = new Mastra({
  workflows: { weatherWorkflow, researchWorkflow },
  agents: { weatherAgent, researchAgent },
  vectors: { pgVectorStore }, //vectors
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
