import { Logger } from '../common/';
import { Placement } from '../lexer/token';
import { errorHeader } from './error';

export enum LexerErrorType {
    InvalidToken,
    UnexpectedCharacter,
    UnterminatedBlockComment,
}

export interface UnexpectedCharacterError {
    type: LexerErrorType.UnexpectedCharacter;
    lexema: string;
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

    public log() {
        const logger = new Logger();

        switch (this.error.type) {
            case LexerErrorType.InvalidToken: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `Invalid Token "${this.error.lexeme}"`,
                });
            }
            case LexerErrorType.UnexpectedCharacter: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `Unexpected character '${this.error.lexema}'`,
                });
            }
            case LexerErrorType.UnterminatedBlockComment: {
                const prefix = errorHeader({
                    line: this.error.line,
                    startsAt: this.error.startsAt,
                });

                return logger.error({
                    prefix,
                    str: `Unterminated block comment`,
                });
            }
        }
    }
}
