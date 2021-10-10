import { Nullable } from '../common/util';
import { LexerError, LexerErrorType } from '../error';
import Token, { Placement } from './token';
import { TokenType } from './token-type';

const keywords: Map<string, TokenType> = new Map([
    ['program', TokenType.PROGRAM],
    ['var', TokenType.VAR],
    ['procedure', TokenType.PROCEDURE],
    ['function', TokenType.FUNCTION],
    ['begin', TokenType.BEGIN],
    ['end', TokenType.END],
    ['false', TokenType.FALSE],
    ['true', TokenType.TRUE],
    ['if', TokenType.IF],
    ['then', TokenType.THEN],
    ['else', TokenType.ELSE],
    ['while', TokenType.WHILE],
    ['do', TokenType.DO],
    ['read', TokenType.READ],
    ['write', TokenType.WRITE],
    ['and', TokenType.AND],
    ['or', TokenType.OR],
    ['not', TokenType.NOT],
    ['div', TokenType.DIV],
]);

export default class Lexer {
    readonly sourceCode: string;
    currentChar: number;
    currentLine: number;
    tokens: Token[];
    currentTokenStart: number;
    currentTokenEnd: number;

    nestedCommentBlock: boolean[] = [];

    constructor(sourceCode: string) {
        this.sourceCode = sourceCode;
        this.currentChar = 0;
        this.currentLine = 1;
        this.tokens = [];
        this.currentTokenStart = 0;
        this.currentTokenEnd = 0;
    }

    private locate(): Placement {
        return new Placement(
            this.currentLine,
            this.currentTokenStart,
            this.currentTokenEnd,
        );
    }

    private isAtEnd() {
        return this.currentChar >= this.sourceCode.length;
    }

    private advance(): string {
        this.currentTokenEnd++;
        return this.sourceCode.charAt(this.currentChar++);
    }

    private peek(): string {
        if (this.isAtEnd()) {
            return '\0';
        }

        return this.sourceCode.charAt(this.currentChar);
    }

    private isDigit(c: string) {
        return c >= '0' && c <= '9';
    }

    private isAlpha(c: string) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
    }

    private isAlphanumeric(c: string) {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private consumed() {
        return this.sourceCode.substring(
            this.currentChar - (this.currentTokenEnd - this.currentTokenStart),
            this.currentChar,
        );
    }

    private newNumber(): Token {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        return this.newToken(TokenType.NUMBER, this.consumed());
    }

    private newIdentifierOrKeyword() {
        while (this.isAlphanumeric(this.peek())) {
            this.advance();
        }

        const text = this.consumed();
        const keyword_type = keywords.get(text);

        if (keyword_type) {
            return this.newToken(keyword_type, text);
        }

        return this.newToken(TokenType.IDENTIFIER, text);
    }

    private newToken(tokenType: TokenType, lexeme: Nullable<string>): Token {
        return new Token(
            tokenType,
            lexeme,
            new Placement(
                this.currentLine,
                this.currentTokenStart,
                this.currentTokenEnd,
            ),
        );
    }

    private matchChar(expected: string): boolean {
        if (this.isAtEnd()) {
            return false;
        }

        if (this.sourceCode.charAt(this.currentChar) != expected) {
            return false;
        }

        this.currentChar++;
        this.currentTokenEnd++;

        return true;
    }

    private scanToken(): Token {
        const c = this.advance();

        switch (c) {
            case '(':
                return this.newToken(TokenType.LEFT_PAREN, c);
            case ')':
                return this.newToken(TokenType.RIGHT_PAREN, c);
            case '.':
                return this.newToken(TokenType.DOT, c);
            case ',':
                return this.newToken(TokenType.COMMA, c);
            case ';':
                return this.newToken(TokenType.SEMICOLON, c);
            case '+':
                return this.newToken(TokenType.PLUS, c);
            case '-':
                return this.newToken(TokenType.MINUS, c);
            case '*':
                return this.newToken(TokenType.STAR, c);
            case '=':
                return this.newToken(TokenType.EQUAL, c);
            case '<':
                if (this.matchChar('=')) {
                    return this.newToken(TokenType.LESS_EQUAL, '<=');
                }

                if (this.matchChar('>')) {
                    return this.newToken(TokenType.DIFFERENCE, '<>');
                }

                return this.newToken(TokenType.LESS, c);
            case '>':
                if (this.matchChar('=')) {
                    return this.newToken(TokenType.GREATER_EQUAL, '>');
                }

                return this.newToken(TokenType.GREATER, c);
            case ':':
                if (this.matchChar('=')) {
                    return this.newToken(TokenType.ASSIGNMENT, ':=');
                }

                return this.newToken(TokenType.COLON, c);

            case '/':
                if (this.matchChar('/')) {
                    while (this.peek() != '\n') {
                        this.advance();
                    }

                    return this.newToken(TokenType.COMMENT, null);
                }

                throw new LexerError({
                    type: LexerErrorType.UnexpectedCharacter,
                    lexema: c,
                    placement: this.locate(),
                });

            case '{':
                this.nestedCommentBlock.push(true);
                while (this.peek() !== '}') {
                    if (this.isAtEnd()) {
                        throw new LexerError({
                            type: LexerErrorType.UnterminatedBlockComment,
                            line: this.currentLine,
                            startsAt: this.currentTokenStart,
                        });
                    }

                    const next = this.advance();

                    if (next === '\n') {
                        this.currentLine++;
                        this.currentTokenStart = 0;
                        this.currentTokenEnd = 0;
                    }

                    if (next === '{') {
                        this.nestedCommentBlock.push(true);
                    }
                }

                while (this.nestedCommentBlock.pop()) {
                    if (this.advance() === '\0') {
                        throw new LexerError({
                            type: LexerErrorType.UnterminatedBlockComment,
                            line: this.currentLine,
                            startsAt: this.currentTokenStart,
                        });
                    }

                    if (this.peek() === '\n') {
                        this.advance();
                        this.currentLine++;
                        this.currentTokenStart = 0;
                        this.currentTokenEnd = 0;
                    }
                }

                return this.newToken(TokenType.COMMENT, null);

            case ' ':
            case '\r':
            case '\t':
                return this.newToken(TokenType.BLANK, null);

            case '\n':
                this.currentLine++;
                this.currentTokenStart = 0;
                this.currentTokenEnd = 0;

                return this.newToken(TokenType.NEWLINE, null);

            default:
                if (this.isDigit(c)) {
                    return this.newNumber();
                }

                if (this.isAlpha(c)) {
                    return this.newIdentifierOrKeyword();
                }

                throw new LexerError({
                    type: LexerErrorType.UnexpectedCharacter,
                    lexema: c,
                    placement: this.locate(),
                });
        }
    }

    public scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.currentTokenStart = this.currentTokenEnd;

            const token = this.scanToken();

            if (
                token.type !== TokenType.NEWLINE &&
                token.type !== TokenType.BLANK &&
                token.type !== TokenType.COMMENT
            ) {
                this.tokens.push(token);
            }
        }

        this.tokens.push(this.newToken(TokenType.EOF, null));

        return this.tokens;
    }
}
