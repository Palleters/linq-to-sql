export abstract class Expression<T> {
    abstract evaluate(): T;
    abstract sql(): string;
}

export type Expr<T> = Expression<T> | T;

export class ConstantExpression<T> extends Expression<T> {
    constructor(public value: T) {
        super();
    }
    evaluate() {
        return this.value;
    }
    sql() {
        return JSON.stringify(this.value); // TODO
    }
}

export const constant = <T>(value: T) => new ConstantExpression(value);

const normalizeExpression = <T>(expression: Expr<T>) => {
    if (expression instanceof Expression) {
        return expression;
    }
    const value = expression;
    return constant(value);
}

export abstract class RecordExpression<T> extends Expression<T> {
}

export class SQLRecordExpression<T> extends RecordExpression<T> {
    constructor(public alias: string) {
        super();
    }
    evaluate(): T {
        throw new Error('Cannot evaluate SQLRecord');
    }
    sql() {
        return this.alias;
    }
}

export class ObjectExpression<T> extends RecordExpression<T> {
    constructor(public object: T) {
        super();
    }
    evaluate(): T {
        return this.object;
    }
    sql(): string {
        throw new Error('Cannot get SQL for ObjectExpression');
    }
}

export class FieldExpression<TRecord, K extends keyof TRecord> extends Expression<TRecord[K]> {
    constructor(public record: RecordExpression<TRecord>, public fieldName: K) {
        super();
    }
    evaluate() {
        return this.record.evaluate()[this.fieldName];
    }
    sql() {
        return `${this.record.sql()}.${this.fieldName}`;
    }
}

export const field = <TRecord, K extends keyof TRecord>(
    record: RecordExpression<TRecord>, fieldName: K) =>
    new FieldExpression(record, fieldName);

class EqualsExpression<T> extends Expression<boolean> {
    constructor(public arg1: Expression<T>, public arg2: Expression<T>) {
        super();
    }
    evaluate() {
        return this.arg1.evaluate() === this.arg2.evaluate();
    }
    sql() {
        return `${this.arg1.sql()} = ${this.arg2.sql()}`;
    }
}

export const equals = <T>(arg1: Expr<T>, arg2: Expr<T>) =>
    new EqualsExpression(normalizeExpression(arg1), normalizeExpression(arg2));

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
