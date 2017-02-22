import { SQL, simpleSQLFragment, combineSQL } from './sql-fragment';

export abstract class Expression<T> {
    abstract evaluate(): T;
    abstract sql(): SQL;

    equals(other: Expr<T>): Expression<boolean> {
        return equals(this, other);
    }
    isOneOf(set: Expr<T>[]): Expression<boolean> {
        return isOneOf(this, set);
    }
}

function constantToSQL(value: any): SQL {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return simpleSQLFragment('');
        }
        let result = constantToSQL(value[0]);
        for (let i = 1; i < value.length; i++) {
            result = combineSQL(
                result,
                simpleSQLFragment(', '),
                constantToSQL(value[i]),
            );
        }
        return result;
    }
    return simpleSQLFragment('?', value);
}

export class ConstantExpression<T> extends Expression<T> {
    constructor(public value: T) {
        super();
    }
    evaluate() {
        return this.value;
    }
    sql() {
        return constantToSQL(this.value);
    }
}

export const constant = <T>(value: T) => new ConstantExpression(value);

export type Expr<T> = Expression<T> | T;

const normalizeExpression = <T>(expression: Expr<T>) => {
    if (expression instanceof Expression) {
        return expression;
    }
    const value = expression;
    return constant(value);
}

class UnaryExpression<TResult, TArg> extends Expression<TResult> {
    constructor(
        public evalFunc: (arg: TArg) => TResult, public sqlOp: string,
        public arg: Expression<TArg>
    ) {
        super();
    }
    evaluate() {
        return this.evalFunc(this.arg.evaluate());
    }
    sql() {
        return combineSQL(
            simpleSQLFragment('('),
            simpleSQLFragment(this.sqlOp),
            simpleSQLFragment(' '),
            this.arg.sql(),
            simpleSQLFragment(')'),
        );
    }
}

class BinaryExpression<TResult, TArg1, TArg2> extends Expression<TResult> {
    constructor(
        public evalFunc: (arg1: TArg1, arg2: TArg2) => TResult, public sqlOp: string,
        public arg1: Expression<TArg1>, public arg2: Expression<TArg2>
    ) {
        super();
    }
    evaluate() {
        return this.evalFunc(this.arg1.evaluate(), this.arg2.evaluate());
    }
    sql() {
        return combineSQL(
            simpleSQLFragment('('),
            this.arg1.sql(),
            simpleSQLFragment(' '),
            simpleSQLFragment(this.sqlOp),
            simpleSQLFragment(' '),
            this.arg2.sql(),
            simpleSQLFragment(')'),
        );
    }
}

class CommutativeExpression<TResult, TArg> extends Expression<TResult> {
    constructor(
        public evalFunc: (args: TArg[]) => TResult,
        public sqlOp: string, public sqlUnit: string,
        public args: Expression<TArg>[]
    ) {
        super();
    }
    evaluate() {
        return this.evalFunc(this.args.map(arg => arg.evaluate()));
    }
    sql() {
        if (this.args.length === 0) {
            return simpleSQLFragment(this.sqlUnit);
        }
        let result = combineSQL(
            simpleSQLFragment('('),
            this.args[0].sql(),
        );
        for (let i = 1; i < this.args.length; i++) {
            result = combineSQL(
                result,
                simpleSQLFragment(' '),
                simpleSQLFragment(this.sqlOp),
                simpleSQLFragment(' '),
                this.args[i].sql(),
            );
        }
        result = combineSQL(result, simpleSQLFragment(')'));
        return result;
    }
}

class InExpression<T> extends Expression<boolean> {
    constructor(public arg1: Expression<T>, public arg2: Expression<T[]>) { // TODO: this should not be fixed to array
        super();
    }
    evaluate() {
        const arg1Value = this.arg1.evaluate();
        return this.arg2.evaluate().some(item => arg1Value === item);
    }
    sql() {
        return combineSQL(
            simpleSQLFragment('('),
            this.arg1.sql(),
            simpleSQLFragment(' IN ('),
            this.arg2.sql(),
            simpleSQLFragment('))'),
        );
    }
}

export const unaryOp = <TResult, TArg>(
    evalFunc: (arg: TArg) => TResult, sqlOp: string,
    arg: Expr<TArg>
) => new UnaryExpression(evalFunc, sqlOp, normalizeExpression(arg));

export const binaryOp = <TResult, TArg1, TArg2>(
    evalFunc: (arg1: TArg1, arg2: TArg2) => TResult, sqlOp: string,
    arg1: Expr<TArg1>, arg2: Expr<TArg2>
) => new BinaryExpression(evalFunc, sqlOp, normalizeExpression(arg1), normalizeExpression(arg2));

export const commutativeOp = <TResult, TArg>(
    evalFunc: (args: TArg[]) => TResult, sqlOp: string, sqlUnit: string,
    args: Expr<TArg>[]
) => new CommutativeExpression(evalFunc, sqlOp, sqlUnit, args.map(normalizeExpression));

export const equals = <T>(arg1: Expr<T>, arg2: Expr<T>): Expression<boolean> =>
    binaryOp((arg1, arg2) => arg1 === arg2, '=', arg1, arg2);

export const and = (...args: Expr<boolean>[]) =>
    commutativeOp(args => args.every(item => item), 'AND', 'TRUE', args);

export const or = (...args: Expr<boolean>[]) =>
    commutativeOp(args => args.some(item => item), 'OR', 'FALSE', args);

export const not = (arg: Expr<boolean>) =>
    unaryOp((arg) => !arg, 'NOT', arg);

export const isOneOf = <T>(arg1: Expr<T>, arg2: Expr<T[]>) =>
    new InExpression(normalizeExpression(arg1), normalizeExpression(arg2));