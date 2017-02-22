import * as knex from 'knex';
import { ISchema, sqlSchema, objectSchema, customerList } from '../testlib/schema';
import {
    equals, field, isOneOf, or, and, not
} from '..';

describe('knex integration', async () => {
    const config = {
        client: 'pg',
        connection: process.env.PG_CONNECTION_STRING,
    };

    const db = knex(config);

    afterAll(async () => {
        await db.destroy();
    });

    await describe('when customer is selected using isOneOf', async () => {
        await it('returns no results from empty DB', async () => {
            const sql = sqlSchema.customers.where(c => c.field('customerID').isOneOf([1,3])).sql;
            const result = await db.raw(sql);
            expect(result.rows).toEqual([]);
        });
    });
});
