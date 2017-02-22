import { Expression } from './expressions';

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

