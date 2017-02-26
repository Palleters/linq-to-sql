require('ts-node/register');
require('dotenv').config();

module.exports = {
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  migrations: {
    tableName: 'knex_migrations'
  }
};
