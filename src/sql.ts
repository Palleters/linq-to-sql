import { Expression } from './expressions';
import { IQueryable } from './interfaces';
import { SQL, combineSQL, simpleSQLFragment } from './sql-fragment';
import { RecordExpression, SQLRecordExpression, ObjectExpression } from './record-expressions';

export abstract class SQLQueryable<T> implements IQueryable<T> {
  constructor(
    public readonly alias: string,
  ) {
  }
  abstract sql(): SQL;
  where(filter: (item: RecordExpression<T>) => Expression<boolean>): SQLQueryable<T> {
    return new SQLFilter(this, filter);
  }
  join<U>(
    other: IQueryable<U>,
    joinExpression: (t: RecordExpression<T>, u: RecordExpression<U>) => Expression<boolean>,
  ): IQueryable<{ t: T; u: U; }> {
    throw new Error('Method not implemented.');
  }
}

export class SQLFilter<T> extends SQLQueryable<T> {
  filter: Expression<boolean>;

  constructor(
    public readonly source: SQLQueryable<T>,
    filter: (item: RecordExpression<T>) => Expression<boolean>,
  ) {
    super('flt');
    this.filter = filter(new SQLRecordExpression<T>(this.alias));
  }

  sql() {
    return combineSQL(
      simpleSQLFragment('SELECT * FROM ('),
      this.source.sql(),
      simpleSQLFragment(`) ${this.alias} WHERE `),
      this.filter.sql(),
    );
  }
}

export class SQLTableBuilder<T> {
  columnMapping<P extends keyof T>(columnName: P, fieldName?: string) {
    return new SQLColumnMapping<T, P>(columnName, fieldName);
  }
}

export class SQLTable<T> extends SQLQueryable<T> {
  columns: {[P in keyof T]: SQLColumnMapping<T, P>};
  constructor(
    public readonly tableName: string,
    public definitionBuilder: (builder: SQLTableBuilder<T>) => {[P in keyof T]: SQLColumnMapping<T, P>},
  ) {
    super('tbl');
    this.columns = definitionBuilder(new SQLTableBuilder<T>());
  }

  sql() {
    const columns = (Object.keys(this.columns) as (keyof T)[])
      .map(column => this.columns[column])
      .map(columnMapping => `${columnMapping.fieldName} as ${columnMapping.columnName}`);
    return combineSQL(
      simpleSQLFragment(`SELECT ${columns ? columns.join(', ') : '*'} FROM `),
      simpleSQLFragment(this.tableName),
      simpleSQLFragment(` ${this.alias}`),
    );
  }
}

export class SQLColumnMapping<T, P extends keyof T> {
  constructor(public columnName: P, public fieldName?: string) {

  }
}
