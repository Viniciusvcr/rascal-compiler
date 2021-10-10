import { Token } from '../lexer';
import { TokenType } from '../lexer/token-type';

export enum ValueType {
    Integer = 1,
    Bool,
}

export class Integer {
    type = ValueType.Integer;
    literal: number;

    constructor(public token: Token) {
        this.literal = parseInt(token.lexeme ?? '0');
    }
}

export class Bool {
    type = ValueType.Bool;

    constructor(public literal: boolean, public token: Token) {}
}

export type Value = Integer | Bool;

export class Identificador {
    constructor(public token: Token) {}
}

export function matchIdentifier(tt: TokenType, t: Token): Token | null {
    switch (tt) {
        case TokenType.IDENTIFIER:
            return t;

        default:
            return null;
    }
}
