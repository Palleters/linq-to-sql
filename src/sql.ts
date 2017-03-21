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
  columnMapping<P extends keyof T>(fieldName: P, columnName?: string) {
    return new SQLFieldMapping<T, P>(fieldName, columnName);
  }
}

export type SQLFieldMappings<T> = {[P in keyof T]: SQLFieldMapping<T, P>};
export type SQLDefinitionBuilder<T> = (builder: SQLTableBuilder<T>) => SQLFieldMappings<T>;

export class SQLTableBuilder2<T> {
  constructor(public readonly fields: SQLFieldMappings<T>) {}
}

export class SQLTable<T> extends SQLQueryable<T> {
  readonly fieldMappings: SQLFieldMappings<T>;
  readonly fields: (keyof T)[];
  constructor(
    tableName: string,
    fields: (keyof T)[],
    definitionBuilder?: (builder: SQLTableBuilder2<T>) => void,
  );
  constructor(
    tableName: string,
    definitionBuilder: SQLDefinitionBuilder<T>,
  );
  constructor(
    public readonly tableName: string,
    fieldsOrDefinitionBuilder: (keyof T)[] | SQLDefinitionBuilder<T>,
    definitionBuilder?: (builder: SQLTableBuilder2<T>) => void,
  ) {
    super('tbl');
    if (typeof fieldsOrDefinitionBuilder === 'function') {
      if (definitionBuilder) {
        throw new Error('cannot specify multiple definitionBuilders');
      }
      this.fieldMappings = fieldsOrDefinitionBuilder(new SQLTableBuilder<T>());
      this.fields = Object.keys(this.fieldMappings) as (keyof T)[];
    } else {
      this.fields = fieldsOrDefinitionBuilder;
      this.fieldMappings = {} as SQLFieldMappings<T>;
      this.fields.forEach(f => {
        this.fieldMappings[f] = new SQLFieldMapping<T, typeof f>(f);
      });
      if (definitionBuilder) {
        definitionBuilder(new SQLTableBuilder2<T>(this.fieldMappings));
      }
    }
  }

  sql() {
    const columns = this.fields
      .map(field => this.fieldMappings[field])
      .map(columnMapping => columnMapping.columnName
        ? `${columnMapping.columnName} as ${columnMapping.fieldName}`
        : columnMapping.fieldName);
    return combineSQL(
      simpleSQLFragment(`SELECT ${columns ? columns.join(', ') : '*'} FROM `),
      simpleSQLFragment(this.tableName),
      simpleSQLFragment(` ${this.alias}`),
    );
  }
}

export class SQLFieldMapping<T, P extends keyof T> {
  constructor(public readonly fieldName: P, public columnName?: string) {
  }
  mapToColumn(columnName: string) {
    this.columnName = columnName;
  }
}
