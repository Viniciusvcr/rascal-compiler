import { Nullable } from 'src/common/util';
import { TokenType } from './token-type';

export class Placement {
    constructor(
        public readonly line: number,
        public readonly startsAt: number,
        public readonly endsAt: number,
    ) {}
}

export default class Token {
    constructor(
        public readonly type: TokenType,
        public readonly lexeme: Nullable<string>,
        public readonly placement: Placement,
    ) {}
}
