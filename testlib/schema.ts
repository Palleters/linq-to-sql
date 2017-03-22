import {
  IQueryable, SQLQueryable, SQLTable, ObjectQueryable, evalSQL, EvaluatedSQL,
} from '..';

export type Customer = {
  customerID: number;
  name: string;
  address: string | null;
}

export interface ISchema {
  customers: IQueryable<Customer>;
}

export class LegacySQLSchema implements ISchema {
  customers: SQLQueryable<Customer> = new SQLTable<Customer>(
    'customer',
    builder => ({
      'customerID': builder.columnMapping('customerID', 'customer_id'),
      'name': builder.columnMapping('name'),
      'address': builder.columnMapping('address'),
    }),
  );
}

export class SQLSchema implements ISchema {
  customers: SQLQueryable<Customer> = new SQLTable<Customer>(
    'customer',
    ['customerID', 'name', 'address'],
    builder => {
      builder.fields.customerID.mapToColumn('customer_id');
    },
  );
}

export const customerList: Customer[] = [
  {
    customerID: 1,
    name: 'customer 1',
    address: null,
  },
  {
    customerID: 2,
    name: 'customer 2',
    address: null,
  },
  {
    customerID: 3,
    name: 'customer 3',
    address: 'customer 3 address',
  },
  {
    customerID: 4,
    name: 'customer 4',
    address: 'customer 4 address',
  },
];

export class ObjectSchema implements ISchema {
  customers = new ObjectQueryable<Customer>(customerList);
}

export const sqlSchema = new SQLSchema();
export const objectSchema = new ObjectSchema();

export const checkQuery = <T>(
  query: (schema: ISchema) => IQueryable<T>,
  expectedSQL: EvaluatedSQL,
  expectedObjects: T[],
) => {
  it('composes the right SQL', () => {
    expect(
      evalSQL(
        (query(sqlSchema) as SQLQueryable<any>).sql()
      )
    ).toEqual(expectedSQL);
  });
  it('returns the right objects', () => {
    expect(
      (query(objectSchema) as ObjectQueryable<any>).value
    ).toEqual(expectedObjects);
  });
};
