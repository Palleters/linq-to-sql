import * as knex from 'knex';

export const up = async (knex: any, Promise: any) => {
  await knex.raw(`
    create table customer (customerid serial primary key, name text not null);
  `);
};

export const down = async (knex: any, Promise: any) => {
  await knex.raw(`
    drop table customer;
  `);
};
