import * as knex from 'knex';

export async function seed(kn: knex, Promise: any) {
  await kn.raw("insert into customer values (1, 'customer 1')");
  await kn.raw("insert into customer values (2, 'customer 2')");
  await kn.raw("insert into customer values (3, 'customer 3')");
  await kn.raw("insert into customer values (4, 'customer 4')");
}
