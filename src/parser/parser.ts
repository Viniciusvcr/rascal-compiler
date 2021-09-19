import ParserError, {
    Error,
    ParserErrorType,
    UParserError,
} from '../error/parser';
import { Token } from '../lexer';
import { TokenType } from '../lexer/token-type';
import { Expr, ExprType } from './expr';
import { matchIdentifier, matchNumberBool } from './literal';
import {
    BinaryArithOp,
    BinaryCompOp,
    BinaryLogicOp,
    matchAddSub,
    matchBinaryCompOp,
    matchMulDiv,
    UnaryOp,
} from './operations';
import { Stmt, StmtType } from './stmt';

export default class Parser {
    private currentLine: number = 0;

    constructor(private tokens: Token[]) {}

    private peek() {
        return this.tokens[0];
    }

    private isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    private advance() {
        const [first, ...rest] = this.tokens;

        this.tokens = rest;
        this.currentLine = first.placement.line;

        return first;
    }

    private check(type: TokenType) {
        return this.peek().type === type;
    }

    private matchAndMap<T>(
        fun: (tt: TokenType, t: Token) => T | null,
    ): T | null {
        const token = this.peek();
        const t = fun(token.type, token);

        if (t) {
            this.advance();
            return t;
        }

        return null;
    }

    private match(types: TokenType[]) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();

                return type;
            }
        }

        return null;
    }

    private consume(tt: TokenType) {
        const currentLine = this.currentLine;

        let token: Token | null;
        if (
            (token = this.matchAndMap((tokenType, t) => {
                switch (tokenType) {
                    case tt:
                        return t;

                    default:
                        return null;
                }
            }))
        ) {
            return token;
        }

        throw new UParserError({
            type: ParserErrorType.Expected,
            line: currentLine,
            tt,
        });
    }

    private primary(): Expr {
        let mapped;
        if ((mapped = this.matchAndMap(matchNumberBool))) {
            return { type: ExprType.Literal, value: mapped };
        }

        if (this.match([TokenType.LEFT_PAREN])) {
            const expr = this.expression();

            this.consume(TokenType.RIGHT_PAREN);

            return { type: ExprType.Grouping, expr };
        }

        if (this.match([TokenType.NOT])) {
            const expr = this.expression();

            return { type: ExprType.LogicNot, expr };
        }

        if ((mapped = this.matchAndMap(matchIdentifier))) {
            return { type: ExprType.Variable, token: mapped };
        }

        throw new UParserError({
            type: ParserErrorType.MissingExpression,
            line: this.currentLine,
        });
    }

    private finishCall(expr: Expr): Expr {
        let params: Expr[] = [];

        if (!this.match([TokenType.RIGHT_PAREN])) {
            params.push(this.expression());

            while (this.match([TokenType.COMMA])) {
                params.push(this.expression());
            }
        }

        this.consume(TokenType.RIGHT_PAREN);

        if (expr.type === ExprType.Variable) {
            return {
                type: ExprType.FunctionCall,
                id: expr.token.lexeme!,
                params,
            };
        }

        throw new UParserError({
            type: ParserErrorType.IdentifierExpected,
            line: this.currentLine,
        });
    }

    private call() {
        const expr = this.primary();

        if (this.match([TokenType.LEFT_PAREN])) {
            return this.finishCall(expr);
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match([TokenType.MINUS])) {
            const expr: Expr = this.unary();

            return {
                type: ExprType.UnaryExpr,
                op: UnaryOp.Minus,
                expr,
            };
        }

        return this.primary();
    }

    private multiplication() {
        let expr: Expr = this.unary();

        let op: BinaryArithOp | null;
        while ((op = this.matchAndMap(matchMulDiv))) {
            const right = this.unary();

            expr = { type: ExprType.BinaryArith, left: expr, op, right };
        }

        return expr;
    }

    private addition() {
        let expr: Expr = this.multiplication();

        let op: BinaryArithOp | null;
        while ((op = this.matchAndMap(matchAddSub))) {
            const right = this.multiplication();

            expr = { type: ExprType.BinaryArith, left: expr, op, right };
        }

        return expr;
    }

    private comparison() {
        let expr: Expr = this.addition();

        let op: BinaryCompOp | null;
        while ((op = this.matchAndMap(matchBinaryCompOp))) {
            const right = this.addition();

            expr = { type: ExprType.BinaryComp, left: expr, op, right };
        }

        return expr;
    }

    private and() {
        let expr: Expr = this.comparison();

        while (this.match([TokenType.AND])) {
            const right = this.comparison();

            expr = {
                type: ExprType.BinaryLogic,
                left: expr,
                op: BinaryLogicOp.And,
                right,
            };
        }

        return expr;
    }

    private or() {
        let expr: Expr = this.and();

        while (this.match([TokenType.OR])) {
            const right = this.and();

            expr = {
                type: ExprType.BinaryLogic,
                left: expr,
                op: BinaryLogicOp.Or,
                right,
            };
        }

        return expr;
    }

    private expression() {
        return this.or();
    }

    private exprStmt() {
        return this.expression();
    }

    private statement(): Stmt {
        return { type: StmtType.ExprStmt, expr: this.exprStmt() };
    }

    public parse(): Stmt[] {
        let stmts: Stmt[] = [];
        let errors: Error[] = [];

        while (!this.isAtEnd()) {
            try {
                const stmt = this.statement();

                stmts.push(stmt);
            } catch (err) {
                const error = (err as UParserError).error;
                errors.push(error);
            }
        }

        if (errors.length) {
            throw new ParserError(errors);
        }

        return stmts;
    }
}
