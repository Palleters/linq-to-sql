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
  join<U>(
    other: IQueryable<U>,
    joinExpression: (t: RecordExpression<T>, u: RecordExpression<U>) => Expression<boolean>
  ): IQueryable<{ t: T; u: U; }> {
    const castOther = other as any as ObjectQueryable<U>; // TODO
    return new ObjectQueryable<{ t: T; u: U; }>(
      ([] as { t: T; u: U; }[]).concat(
        ...this.value.map(
          t => castOther.where(
            u => joinExpression(new ObjectExpression(t), u)
          ).value.map(u => ({ t, u }))
        )
      )
    );
  }
}

