import { Expression } from './expressions';
import { IQueryable } from './interfaces';
import { RecordExpression, ObjectExpression } from './record-expressions';

export class ObjectQueryable<T> implements IQueryable<T> {
  constructor(
    public readonly value: T[],
  ) {
  }
  where(filter: (item: RecordExpression<T>) => Expression<boolean>): ObjectQueryable<T> {
    return new ObjectQueryable<T>(this.value.filter(item => filter(new ObjectExpression(item)).evaluate()));
  }
}
