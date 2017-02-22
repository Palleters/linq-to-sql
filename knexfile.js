require('ts-node/register');

module.exports = {
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  migrations: {
    tableName: 'knex_migrations'
  }
};
