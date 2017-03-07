import { Expression } from './expressions';
import { RecordExpression } from './record-expressions';

export interface IQueryable<T> {
  join<U>(
    other: IQueryable<U>,
    joinExpression: (t: RecordExpression<T>, u: RecordExpression<U>) => Expression<boolean>,
  ): IQueryable<{ t: T, u: U }>;
  where(filter: (item: RecordExpression<T>) => Expression<boolean>): IQueryable<T>;
}
