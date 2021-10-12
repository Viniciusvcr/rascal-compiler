import { Logger } from '../common';
import { TokenType, toString } from '../lexer/token-type';
import IError, { errorHeader } from './error';

export enum ParserErrorType {
    IdentifierExpected,
    MissingExpression,
    Expected,
    UnexpectedToken,
}

export interface IdentifierExpected {
    type: ParserErrorType.IdentifierExpected;
    line: number;
}

export interface MissingExpression {
    type: ParserErrorType.MissingExpression;
    line: number;
}

export interface Expected {
    type: ParserErrorType.Expected;
    line: number;
    tt: TokenType;
}

export interface UnexpectedToken {
    type: ParserErrorType.UnexpectedToken;
    line: number;
    tt: TokenType;
}

export type Error =
    | IdentifierExpected
    | MissingExpression
    | Expected
    | UnexpectedToken;

export class UParserError {
    constructor(public readonly error: Error) {}
}

export default class ParserError implements IError {
    constructor(public readonly errors: Error[]) {}

    log(): void {
        const logger = new Logger();

        for (const error of this.errors) {
            switch (error.type) {
                case ParserErrorType.Expected: {
                    const prefix = errorHeader({ line: error.line });

                    return logger.error({
                        prefix,
                        str: `'${toString(error.tt)}' Expected`,
                    });
                }

                case ParserErrorType.IdentifierExpected: {
                    const prefix = errorHeader({ line: error.line });

                    return logger.error({ prefix, str: 'Identifier expected' });
                }

                case ParserErrorType.MissingExpression: {
                    const prefix = errorHeader({ line: error.line });

                    return logger.error({
                        prefix,
                        str: 'Missing an expression',
                    });
                }

                case ParserErrorType.UnexpectedToken: {
                    const prefix = errorHeader({ line: error.line });

                    return logger.error({
                        prefix,
                        str: `Unexpected token '${toString(
                            error.tt,
                        )}' in this position`,
                    });
                }
            }
        }
    }
}
