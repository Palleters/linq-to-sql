export abstract class Expression<T> {
    abstract evaluate(): T;
    abstract sql(): string;
}

function constantToSQL(value: any): string {
    if (Array.isArray(value)) {
        return value.map(constantToSQL).join(', ');
    }
    if (typeof value === 'string') {
        return `'${value.replace(`'`, `''`)}'`;
    }
    if (typeof value === 'number') {
        return `${value}`;
    }
    throw new Error(`constantToSQL for ${typeof value} not implemented`);
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
        return `(${this.sqlOp} ${this.arg.sql()})`;
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
        return `(${this.arg1.sql()} ${this.sqlOp} ${this.arg2.sql()})`;
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
            return this.sqlUnit;
        }
        return `(${this.args.map(arg => arg.sql()).join(` ${this.sqlOp} `)})`
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
        return `(${this.arg1.sql()} IN (${this.arg2.sql()}))`;
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

export const equals = <T>(arg1: Expr<T>, arg2: Expr<T>) =>
    binaryOp((arg1, arg2) => arg1 === arg2, '=', arg1, arg2);

export const and = <T>(...args: Expr<boolean>[]) =>
    commutativeOp(args => args.every(item => item), 'AND', 'TRUE', args);

export const or = <T>(...args: Expr<boolean>[]) =>
    commutativeOp(args => args.some(item => item), 'OR', 'FALSE', args);

export const not = <T>(arg: Expr<boolean>) =>
    unaryOp((arg) => !arg, 'NOT', arg);

export const isOneOf = <T>(arg1: Expr<T>, arg2: Expr<T[]>) =>
    new InExpression(normalizeExpression(arg1), normalizeExpression(arg2));

