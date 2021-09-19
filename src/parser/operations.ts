import { TokenType } from '../lexer/token-type';

export enum UnaryOp {
    Minus = 1,
}

export enum BinaryCompOp {
    Equal = 1,
    NotEqual,
    LessThan,
    LessEqual,
    Greater,
    GreaterEqual,
}

export enum BinaryArithOp {
    Add = 1,
    Sub,
    Mul,
    Div,
}

export enum BinaryLogicOp {
    And = 1,
    Or,
}

export function matchBinaryCompOp(t: TokenType) {
    switch (t) {
        case TokenType.DIFFERENCE:
            return BinaryCompOp.NotEqual;

        case TokenType.EQUAL:
            return BinaryCompOp.Equal;

        case TokenType.GREATER:
            return BinaryCompOp.Greater;

        case TokenType.GREATER_EQUAL:
            return BinaryCompOp.GreaterEqual;

        case TokenType.LESS:
            return BinaryCompOp.LessThan;

        case TokenType.LESS_EQUAL:
            return BinaryCompOp.LessEqual;

        default:
            return null;
    }
}

export function matchAddSub(t: TokenType) {
    switch (t) {
        case TokenType.PLUS:
            return BinaryArithOp.Add;

        case TokenType.MINUS:
            return BinaryArithOp.Sub;

        default:
            return null;
    }
}

export function matchMulDiv(t: TokenType) {
    switch (t) {
        case TokenType.STAR:
            return BinaryArithOp.Mul;

        case TokenType.DIV:
            return BinaryArithOp.Div;

        default:
            return null;
    }
}
