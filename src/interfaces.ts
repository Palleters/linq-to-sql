import { Expression } from './expressions';
import { RecordExpression, SQLRecordExpression, ObjectExpression } from './record-expressions';

export interface IQueryable<T> {
    where(filter: (item: RecordExpression<T>) => Expression<boolean>): IQueryable<T>;
}

export abstract class SQLQueryable<T> implements IQueryable<T> {
    constructor(public alias: string) {
    }
    abstract get sql(): string;
    where(filter: (item: RecordExpression<T>) => Expression<boolean>): SQLQueryable<T> {
        return new SQLFilter(this, filter);
    }
}

export class SQLFilter<T> extends SQLQueryable<T> {
    filter: Expression<boolean>;

    constructor(public source: SQLQueryable<T>, filter: (item: RecordExpression<T>) => Expression<boolean>) {
        super('f');
        this.filter = filter(new SQLRecordExpression<T>(this.alias));
    }

    get sql() {
        return `SELECT * FROM (${this.source.sql}) f WHERE ${this.filter.sql()}`;
    }
}


export class SQLTable<T> extends SQLQueryable<T> {
    constructor(public tableName: string) {
        super('t');
    }

    get sql() {
        return `SELECT * FROM ${this.tableName} t`;
    }
}

export class ObjectQueryable<T> implements IQueryable<T> {
    constructor(public value: T[]) {
    }
    where(filter: (item: RecordExpression<T>) => Expression<boolean>): ObjectQueryable<T> {
        return new ObjectQueryable<T>(this.value.filter(item => filter(new ObjectExpression(item)).evaluate()));
    }
}
