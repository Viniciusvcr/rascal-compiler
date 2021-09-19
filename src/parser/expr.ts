import { Token } from '../lexer';
import {
    BinaryArithOp,
    BinaryCompOp,
    BinaryLogicOp,
    UnaryOp,
} from './operations';
import { Value, Identifier } from './literal';

export enum ExprType {
    UnaryExpr = 1,
    BinaryComp,
    BinaryArith,
    BinaryLogic,
    Variable,
    Literal,
    Grouping,
    LogicNot,
    FunctionCall,
}

export interface Unary {
    type: ExprType.UnaryExpr;
    op: UnaryOp;
    expr: Expr;
}

export interface BinaryComp {
    type: ExprType.BinaryComp;
    left: Expr;
    op: BinaryCompOp;
    right: Expr;
}

export interface BinaryArith {
    type: ExprType.BinaryArith;
    left: Expr;
    op: BinaryArithOp;
    right: Expr;
}

export interface BinaryLogic {
    type: ExprType.BinaryLogic;
    left: Expr;
    op: BinaryLogicOp;
    right: Expr;
}

export interface Variable {
    type: ExprType.Variable;
    token: Token;
}

export interface Literal {
    type: ExprType.Literal;
    value: Value;
}

export interface Grouping {
    type: ExprType.Grouping;
    expr: Expr;
}

export interface LogicNot {
    type: ExprType.LogicNot;
    expr: Expr;
}

export interface FunctionCall {
    type: ExprType.FunctionCall;
    id: Identifier;
    params: Expr[];
}

export type Expr =
    | Unary
    | BinaryComp
    | BinaryArith
    | BinaryLogic
    | Variable
    | Literal
    | Grouping
    | LogicNot
    | FunctionCall;
