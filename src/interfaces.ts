import { Expression } from './expressions';
import { RecordExpression, SQLRecordExpression, ObjectExpression } from './record-expressions';
import { SQL, combineSQL, simpleSQLFragment } from './sql-fragment';

export interface IQueryable<T> {
  where(filter: (item: RecordExpression<T>) => Expression<boolean>): IQueryable<T>;
}

export abstract class SQLQueryable<T> implements IQueryable<T> {
  constructor(
    public readonly alias: string,
  ) {
  }
  abstract sql(): SQL;
  where(filter: (item: RecordExpression<T>) => Expression<boolean>): SQLQueryable<T> {
    return new SQLFilter(this, filter);
  }
}

export class SQLFilter<T> extends SQLQueryable<T> {
  filter: Expression<boolean>;

  constructor(
    public readonly source: SQLQueryable<T>,
    filter: (item: RecordExpression<T>) => Expression<boolean>,
  ) {
    super('f');
    this.filter = filter(new SQLRecordExpression<T>(this.alias));
  }

  sql() {
    return combineSQL(
      simpleSQLFragment('SELECT * FROM ('),
      this.source.sql(),
      simpleSQLFragment(') f WHERE '),
      this.filter.sql(),
    );
  }
}

export class SQLTable<T> extends SQLQueryable<T> {
  constructor(
    public readonly tableName: string,
  ) {
    super('t');
  }

  sql() {
    return combineSQL(
      simpleSQLFragment('SELECT * FROM '),
      simpleSQLFragment(this.tableName),
      simpleSQLFragment(' t'),
    );
  }
}

export class ObjectQueryable<T> implements IQueryable<T> {
  constructor(
    public readonly value: T[],
  ) {
  }
  where(filter: (item: RecordExpression<T>) => Expression<boolean>): ObjectQueryable<T> {
    return new ObjectQueryable<T>(this.value.filter(item => filter(new ObjectExpression(item)).evaluate()));
  }
}
