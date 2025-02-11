import type { Knex } from 'knex';
import config from './config';

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: config.DATABASE_URL,
  migrations: {
    directory: './src/db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './src/db/seeds',
    extension: 'ts',
  },
};

export default knexConfig;
