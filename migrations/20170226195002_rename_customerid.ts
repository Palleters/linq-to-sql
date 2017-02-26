import * as knex from 'knex';

export const up = async (knex: any, Promise: any) => {
  await knex.raw(`
    alter table customer rename customerid to customer_id;
  `);
};

export const down = async (knex: any, Promise: any) => {
  await knex.raw(`
    alter table customer rename customer_id to customerid;
  `);
};
