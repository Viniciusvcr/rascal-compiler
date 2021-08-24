import { Placement } from 'src/lexer/token';

export enum LexerErrorType {
    InvalidToken,
    UnexpectedCharacter,
    UnterminatedBlockComment,
}

export interface UnexpectedCharacterError {
    type: LexerErrorType.UnexpectedCharacter;
    placement: Placement;
}

export interface UnterminatedBlockComment {
    type: LexerErrorType.UnterminatedBlockComment;
    line: number;
    startsAt: number;
}

export interface InvalidToken {
    type: LexerErrorType.InvalidToken;
    lexeme: string;
    placement: Placement;
}

export type Error =
    | UnexpectedCharacterError
    | InvalidToken
    | UnterminatedBlockComment;

export default class LexerError {
    constructor(public readonly error: Error) {}

    public show() {
        switch (this.error.type) {
            case LexerErrorType.InvalidToken:
                return `Invalid Token ${this.error.lexeme}`;
            case LexerErrorType.UnexpectedCharacter:
                return `Unexpected character in line ${this.error.placement.line}`;
            case LexerErrorType.UnterminatedBlockComment:
                return `Unterminated block comment in line ${this.error.line}`;
        }
    }
}
