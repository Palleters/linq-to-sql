import { Expression } from './expressions';
import { RecordExpression } from './record-expressions';

export interface IQueryable<T> {
  where(filter: (item: RecordExpression<T>) => Expression<boolean>): IQueryable<T>;
}
