import Error from './error';

export enum LexerErrorType {
    InvalidToken,
    InvalidCharacter,
    UnterminatedString,
}

export default class LexerError implements Error {
    constructor(
        private readonly type: LexerErrorType,
        public readonly line: number,
        public readonly startsAt: number,
        public readonly endsAt: number,
    ) {}

    toString(): string {
        switch (this.type) {
            case LexerErrorType.InvalidCharacter:
                return `Invalid character`;

            case LexerErrorType.InvalidToken:
                return `Invalid syntax`;

            case LexerErrorType.UnterminatedString:
                return 'Unterminated string';
        }
    }
}
