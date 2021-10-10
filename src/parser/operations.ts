import { Token } from '../lexer';
import { TokenType } from '../lexer/token-type';

export enum OpRelacao {
    Igualdade = 1,
    Diferenca,
    MenorQue,
    MenorIgual,
    Maior,
    MaiorIgual,
}

export enum OpExprSimples {
    Soma,
    Sub,
    Or,
}

export enum OpTermo {
    Mul,
    Div,
    And,
}

export function matchOpRelacao(tt: TokenType, t: Token) {
    switch (tt) {
        case TokenType.DIFFERENCE:
            return t;

        case TokenType.EQUAL:
            return t;

        case TokenType.GREATER:
            return t;

        case TokenType.GREATER_EQUAL:
            return t;

        case TokenType.LESS:
            return t;

        case TokenType.LESS_EQUAL:
            return t;

        default:
            return null;
    }
}

export function matchOpExprSimples(tt: TokenType, t: Token) {
    switch (tt) {
        case TokenType.PLUS:
            return t;

        case TokenType.MINUS:
            return t;

        case TokenType.OR:
            return t;

        default:
            return null;
    }
}

export function matchOpTermo(tt: TokenType, t: Token) {
    switch (tt) {
        case TokenType.STAR:
            return t;

        case TokenType.DIV:
            return t;

        case TokenType.AND:
            return t;

        default:
            return null;
    }
}
