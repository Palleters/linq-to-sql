import {
    IQueryable, SQLQueryable, SQLTable, ObjectQueryable, evalSQL, EvaluatedSQL,
} from '..';

export class Customer {
    customerID: number;
    name: string;
}

export interface ISchema {
    customers: IQueryable<Customer>;
}

export class SQLSchema implements ISchema {
    customers: SQLQueryable<Customer> = new SQLTable<Customer>('customer');
}

export const customerList = [
    {
        customerID: 1,
        name: 'customer 1',
    },
    {
        customerID: 2,
        name: 'customer 2',
    },
    {
        customerID: 3,
        name: 'customer 3',
    },
    {
        customerID: 4,
        name: 'customer 4',
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