import { Expression } from './expressions';
import { simpleSQLFragment, combineSQL, SQL } from './sql-fragment';

export abstract class RecordExpression<T> extends Expression<T> {
  field<K extends keyof T>(fieldName: K): FieldExpression<T, K> {
    return field(this, fieldName);
  }
}

export class SQLRecordExpression<T> extends RecordExpression<T> {
  constructor(
    public readonly alias: string,
  ) {
    super();
  }
  evaluate(): T {
    throw new Error('Cannot evaluate SQLRecord');
  }
  sql() {
    return simpleSQLFragment(this.alias);
  }
}

export class ObjectExpression<T> extends RecordExpression<T> {
  constructor(
    public readonly object: T,
  ) {
    super();
  }
  evaluate(): T {
    return this.object;
  }
  sql(): SQL {
    throw new Error('Cannot get SQL for ObjectExpression');
  }
}

export class FieldExpression<TRecord, K extends keyof TRecord> extends Expression<TRecord[K]> {
  constructor(
    public readonly record: RecordExpression<TRecord>,
    public readonly fieldName: K,
  ) {
    super();
  }
  evaluate() {
    return this.record.evaluate()[this.fieldName];
  }
  sql() {
    return combineSQL(
      this.record.sql(),
      simpleSQLFragment('.'),
      simpleSQLFragment(this.fieldName),
    );
  }
}

export const field = <TRecord, K extends keyof TRecord>(
  record: RecordExpression<TRecord>, fieldName: K) =>
  new FieldExpression(record, fieldName);

