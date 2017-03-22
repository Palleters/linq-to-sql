/// <reference path="../node_modules/@types/jest/index.d.ts" />

import {
  IQueryable, SQLQueryable, SQLTable, ObjectQueryable,
  equals, field, isOneOf, or, and, not,
  isNull, isNotNull,
} from '..';
import { ISchema, sqlSchema, objectSchema, customerList, checkQuery } from '../testlib/schema';

// TODO: extensibiliy

describe('BasicSchema', () => {
  describe('when all customers are selected', () => {
    checkQuery(
      (schema: ISchema) => schema.customers,
      {
        sql: 'SELECT customer_id as customerID, name, address FROM customer tbl',
        bindings: [],
      },
      customerList,
    );
  });

  describe('when customer is selected by ID', () => {
    checkQuery(
      (schema: ISchema) => schema.customers.where(c => equals(field(c, 'customerID'), 1)),
      {
        sql: 'SELECT * FROM (SELECT customer_id as customerID, name, address FROM customer tbl) flt WHERE (flt.customerID = ?)',
        bindings: [1],
      },
      [
        customerList[0],
      ],
    );
  });

  describe('when customer is selected using isOneOf', () => {
    checkQuery(
      (schema: ISchema) => schema.customers.where(c => isOneOf(field(c, 'customerID'), [1, 3])),
      {
        sql: 'SELECT * FROM (SELECT customer_id as customerID, name, address FROM customer tbl) flt WHERE (flt.customerID IN (?, ?))',
        bindings: [1, 3],
      },
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
      {
        sql: 'SELECT * FROM (SELECT customer_id as customerID, name, address FROM customer tbl) flt WHERE (((flt.customerID = ?) OR (flt.customerID = ?) OR (flt.name = ?)) AND (NOT (flt.customerID = ?)))',
        bindings: [1, 3, 'customer 4', 3],
      },
      [
        customerList[0],
        customerList[3],
      ],
    );
  });

  describe('when customer is selected by nullable field', () => {
    checkQuery(
      (schema: ISchema) => schema.customers.where(c =>
        and(
            c.field('address').isNull(),
            c.field('customerID').isNotNull(),
        ),
      ),
      {
        sql: 'SELECT * FROM (SELECT customer_id as customerID, name, address FROM customer tbl) flt WHERE ((flt.address IS NULL) AND (flt.customerID IS NOT NULL))',
        bindings: [],
      },
      [
        customerList[0],
        customerList[1],
      ],
    );
  });

});
