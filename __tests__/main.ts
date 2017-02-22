/// <reference path="../node_modules/@types/jest/index.d.ts" />

import {
    IQueryable, SQLQueryable, SQLTable, ObjectQueryable,
    equals, field, isOneOf, or, and, not
} from '..';
import { ISchema, sqlSchema, objectSchema, customerList, checkQuery } from '../testlib/schema';

// IN for any field
// AND/OR
// extensibiliy

describe('BasicSchema', () => {
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
            'SELECT * FROM (SELECT * FROM customer t) f WHERE (f.customerID = 1)',
            [
                customerList[0],
            ],
        );
    });

    describe('when customer is selected using isOneOf', () => {
        checkQuery(
            (schema: ISchema) => schema.customers.where(c => isOneOf(field(c, 'customerID'), [1, 3])),
            'SELECT * FROM (SELECT * FROM customer t) f WHERE (f.customerID IN (1, 3))',
            [
                customerList[0],
                customerList[2],
            ],
        );
    });

    describe('when customer is selected by more complex boolean expression', () => {
        checkQuery(
            (schema: ISchema) => schema.customers.where(c =>
                and(
                    or(
                        field(c, 'customerID').equals(1),
                        field(c, 'customerID').equals(3),
                        field(c, 'name').equals('customer 4'),
                    ),
                    not(
                        c.field('customerID').equals(3),
                    ),
                )
            ),
            'SELECT * FROM (SELECT * FROM customer t) f WHERE (((f.customerID = 1) OR (f.customerID = 3) OR (f.name = \'customer 4\')) AND (NOT (f.customerID = 3)))',
            [
                customerList[0],
                customerList[3],
            ],
        );
    });

});
