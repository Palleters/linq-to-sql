export type Binding<T> = {
    readonly value: T;
};
export type SQL = {
    readonly sqlFragments: string[];
    readonly bindings: Binding<any>[];
};
export const simpleSQLFragment = (sql: string, ...bindings: any[]) => ({
    sqlFragments: [sql],
    bindings: bindings.map(binding => ({
        value: binding,
    })),
});
export const combineSQL = (...args: SQL[]): SQL => ({
    sqlFragments: [].concat(...args.map(arg => arg.sqlFragments)),
    bindings: [].concat(...args.map(arg => arg.bindings)),
});
export type EvaluatedSQL = {
    readonly sql: string;
    readonly bindings: any[],
};
export const evalSQL = (sql: SQL): EvaluatedSQL => ({
    sql: sql.sqlFragments.join(''),
    bindings: sql.bindings.map(b => b.value),
});

