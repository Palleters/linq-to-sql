import * as knex from 'knex';

export const up = async (knex: any, Promise: any) => {
  await knex.raw(`
    alter table customer add column address text;
    update customer set address = 'customer 3 address' where customer_id = 3;
    update customer set address = 'customer 4 address' where customer_id = 4;
  `);
};

export const down = async (knex: any, Promise: any) => {
  await knex.raw(`
    alter table customer drop column address;
  `);
};
