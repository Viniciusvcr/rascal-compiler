import { Expr } from './expr';

export enum StmtType {
    ExprStmt = 1,
}

export interface ExprStmt {
    type: StmtType.ExprStmt;
    expr: Expr;
}

export type Stmt = ExprStmt;
