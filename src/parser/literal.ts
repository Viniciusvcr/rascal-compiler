import { Token } from '../lexer';
import { TokenType } from '../lexer/token-type';

export enum ValueType {
    Integer = 1,
    Bool,
}

export interface Integer {
    type: ValueType.Integer;
    literal: number;
}

export interface Bool {
    type: ValueType.Bool;
    literal: boolean;
}

export type Value = Integer | Bool;

export type Identifier = String;

export function matchNumberBool(tt: TokenType, t: Token): Value | null {
    switch (tt) {
        case TokenType.FALSE:
            return { type: ValueType.Bool, literal: false };

        case TokenType.TRUE:
            return { type: ValueType.Bool, literal: true };

        case TokenType.NUMBER:
            return {
                type: ValueType.Integer,
                literal: parseInt(t.lexeme ?? '0'),
            };

        default:
            return null;
    }
}

export function matchIdentifier(tt: TokenType, t: Token): Token | null {
    switch (tt) {
        case TokenType.IDENTIFIER:
            return t;

        default:
            return null;
    }
}
