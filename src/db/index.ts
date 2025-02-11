import knexConfig from '../knexfile';
import { knex } from 'knex';

const knexInstance = knex(knexConfig);

export default knexInstance;