/// <reference path="../node_modules/@types/jest/index.d.ts" />

import { IQueryable, SQLQueryable, SQLTable, ObjectQueryable, equals, field, constant } from '../src/interfaces';

// IN for any field
// AND/OR
// extensibiliy

describe('BasicSchema', () => {
    class Customer {
        customerID: number;
        name: string;
    }

    interface ISchema {
        customers: IQueryable<Customer>;
    }

    class SQLSchema implements ISchema {
        customers: SQLQueryable<Customer> = new SQLTable<Customer>('customer');
    }

    const customerList = [
        {
            customerID: 1,
            name: 'customer 1',
        },
        {
            customerID: 2,
            name: 'customer 2',
        },
    ];

    class ObjectSchema implements ISchema {
        customers = new ObjectQueryable<Customer>(customerList);
    }

    const sqlSchema = new SQLSchema();
    const objectSchema = new ObjectSchema();

    const checkQuery = <T>(
        query: (schema: ISchema) => IQueryable<T>,
        expectedSQL: string,
        expectedObjects: T[],
    ) => {
        it('composes the right SQL', () => {
            expect((query(sqlSchema) as SQLQueryable<any>).sql).toBe(expectedSQL);
        });
        it('returns the right objects', () => {
            expect((query(objectSchema) as ObjectQueryable<any>).value).toEqual(expectedObjects);
        });
    };

    describe('when all customers are selected', () => {
        checkQuery(
            (schema: ISchema) => schema.customers,
            'SELECT * FROM customer t',
            customerList,
        );
    });

    describe('when customer is selected by ID', () => {
        checkQuery(
            (schema: ISchema) => schema.customers.where(c => equals(field(c, 'customerID'), 1)),
            'SELECT * FROM (SELECT * FROM customer t) f WHERE f.customerID = 1',
            [
                customerList[0],
            ],
        );
    });

});
