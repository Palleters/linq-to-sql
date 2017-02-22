import * as knex from 'knex';
import { ISchema, sqlSchema, objectSchema, customerList } from '../testlib/schema';
import {
    equals, field, isOneOf, or, and, not, evalSQL
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

    describe('when customer is selected using isOneOf', async () => {
        it('returns correct results from DB', async () => {
            const sql = evalSQL(sqlSchema.customers.where(c => c.field('customerID').isOneOf([1, 3])).sql());
            const result = await db.raw(sql.sql, sql.bindings);
            expect(result.rows).toEqual([
                {
                    customerid: 1, // TODO: underscore, case
                    name: 'customer 1',
                },
                {
                    customerid: 3,
                    name: 'customer 3',
                },
            ]);
        });
    });

    describe('when customer is selected using name', async () => {
        it('returns correct results from DB', async () => {
            const sql = evalSQL(sqlSchema.customers.where(c => c.field('name').isOneOf(['customer 1', 'customer 3'])).sql());
            const result = await db.raw(sql.sql, sql.bindings);
            expect(result.rows).toEqual([
                {
                    customerid: 1, // TODO: underscore, case
                    name: 'customer 1',
                },
                {
                    customerid: 3,
                    name: 'customer 3',
                },
            ]);
        });
    });
});
