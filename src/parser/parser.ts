import ParserError, {
    Error,
    ParserErrorType,
    UParserError,
} from '../error/parser';
import { Token } from '../lexer';
import { TokenType } from '../lexer/token-type';
import {
    Atribuicao,
    ChamadaProcedimento,
    Comando,
    Condicional,
    Escrita,
    Expr,
    ExprSimples,
    Leitura,
    ListaExpr,
    Repeticao,
    Termo,
} from './comando';
import {
    Bloco,
    ComandoComposto,
    Decl,
    DeclFuncao,
    DeclParametros,
    DeclProcedimento,
    DeclVariaveis,
    ListaIdentificadores,
    ParametrosFormais,
    Programa,
    SecaoDeclSubrotinas,
    SecaoDeclVariaveis,
    Tipo,
} from './decl';
import {
    Agrupamento,
    ChamadaFuncao,
    Fator,
    Logico,
    Negacao,
    Numero,
    UMinus,
    Variavel,
} from './fator';
import { Bool, Identificador, Integer, matchIdentifier } from './literal';
import {
    matchOpExprSimples,
    matchOpRelacao,
    matchOpTermo,
    OpRelacao,
} from './operations';

export default class Parser {
    private currentLine: number = 0;

    constructor(private tokens: Token[]) {}

    private peek() {
        return this.tokens[0];
    }

    private advance() {
        const [first, ...rest] = this.tokens;

        this.tokens = rest;
        this.currentLine = first.placement.line;

        return first;
    }

    private check(type: TokenType | TokenType[]) {
        return Array.isArray(type)
            ? type.includes(this.peek().type)
            : this.peek().type === type;
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

    private tipo() {
        if (this.check(TokenType.IDENTIFIER)) {
            const token = this.advance();

            return new Tipo(new Identificador(token));
        }

        throw new UParserError({
            type: ParserErrorType.IdentifierExpected,
            line: this.currentLine,
        });
    }

    private listaIdentificadores() {
        const identificadores: Identificador[] = [this.identificador()];

        while (this.check(TokenType.COMMA)) {
            this.advance();

            identificadores.push(this.identificador());
        }

        return new ListaIdentificadores(identificadores);
    }

    private declVariaveis() {
        const listaIdentificadores = this.listaIdentificadores();
        this.consume(TokenType.COLON);
        const tipo = this.tipo();

        return new DeclVariaveis(listaIdentificadores, tipo);
    }

    private secaoDeclVariaveis() {
        if (this.check(TokenType.VAR)) {
            this.advance();
            const declVariaveis: DeclVariaveis[] = [this.declVariaveis()];
            this.consume(TokenType.SEMICOLON);

            while (this.check(TokenType.IDENTIFIER)) {
                declVariaveis.push(this.declVariaveis());
                this.consume(TokenType.SEMICOLON);
            }

            return new SecaoDeclVariaveis(declVariaveis);
        }

        return null;
    }

    private declParametros() {
        if (this.check(TokenType.VAR)) {
            this.advance();
        }

        const listaIdentificadores = this.listaIdentificadores();
        this.consume(TokenType.COLON);
        const tipo = this.tipo();

        return new DeclParametros(listaIdentificadores, tipo);
    }

    private parametrosFormais() {
        const declParametros: DeclParametros[] = [];

        if (this.check(TokenType.VAR) || this.check(TokenType.IDENTIFIER)) {
            declParametros.push(this.declParametros());

            while (this.match([TokenType.SEMICOLON])) {
                declParametros.push(this.declParametros());
            }
        }

        return new ParametrosFormais(declParametros);
    }

    private declProcedimento() {
        const identificador = this.identificador();

        this.consume(TokenType.LEFT_PAREN);
        const parametrosFormais = this.parametrosFormais();
        this.consume(TokenType.RIGHT_PAREN);

        this.consume(TokenType.SEMICOLON);

        const bloco = this.bloco();

        return new DeclProcedimento(identificador, bloco, parametrosFormais);
    }

    private declFuncao() {
        const identificador = this.identificador();

        this.consume(TokenType.LEFT_PAREN);
        const parametrosFormais = this.parametrosFormais();
        this.consume(TokenType.RIGHT_PAREN);

        this.consume(TokenType.COLON);

        const tipoRetorno = this.tipo();

        this.consume(TokenType.SEMICOLON);

        const bloco = this.bloco();

        return new DeclFuncao(
            identificador,
            tipoRetorno,
            bloco,
            parametrosFormais,
        );
    }

    private secaoDeclSubrotinas() {
        const declaracoes: Array<DeclProcedimento | DeclFuncao> = [];

        let peek = this.peek();
        while (
            peek.type === TokenType.PROCEDURE ||
            peek.type === TokenType.FUNCTION
        ) {
            const next = this.advance();

            if (next.type === TokenType.PROCEDURE) {
                declaracoes.push(this.declProcedimento());
            } else {
                declaracoes.push(this.declFuncao());
            }

            this.consume(TokenType.SEMICOLON);

            peek = this.peek();
        }

        return declaracoes.length ? new SecaoDeclSubrotinas(declaracoes) : null;
    }

    private expressao(): Expr {
        const exprEsq = this.expressaoSimples();

        let token: Token | null = null;
        if ((token = this.matchAndMap(matchOpRelacao))) {
            const exprDir = this.expressaoSimples();
            return new Expr(exprEsq, token, exprDir);
        }

        return new Expr(exprEsq, null, null);
    }

    private expressaoSimples(): ExprSimples {
        const termoEsq = this.termo();
        let exprSimples = new ExprSimples(termoEsq, null, null);

        let op: Token | null = null;
        while ((op = this.matchAndMap(matchOpExprSimples))) {
            const termoDir = this.termo();

            exprSimples = new ExprSimples(
                new Termo(
                    exprSimples.termoEsq.fatorEsq,
                    exprSimples.op,
                    exprSimples.termoDir?.fatorDir || null,
                ),
                op,
                termoDir,
            );
        }

        return exprSimples;
    }

    private listaExpr() {
        const exprs: Expr[] = [this.expressao()];

        while (this.check(TokenType.COMMA)) {
            this.advance();

            exprs.push(this.expressao());
        }

        return new ListaExpr(exprs);
    }

    private chamadaFuncao(tokenId: Token) {
        const identificador = new Identificador(tokenId);
        this.consume(TokenType.LEFT_PAREN);

        if (
            this.check([
                TokenType.IDENTIFIER,
                TokenType.NUMBER,
                TokenType.BOOLEAN,
                TokenType.LEFT_PAREN,
                TokenType.NOT,
                TokenType.MINUS,
            ])
        ) {
            const exprs = this.listaExpr();
            this.consume(TokenType.RIGHT_PAREN);

            return new ChamadaFuncao(identificador, exprs);
        }

        this.consume(TokenType.RIGHT_PAREN);

        return new ChamadaFuncao(identificador, new ListaExpr([]));
    }

    private fator(): Fator {
        const next = this.advance();

        switch (next.type) {
            case TokenType.IDENTIFIER: {
                if (this.check(TokenType.LEFT_PAREN)) {
                    return this.chamadaFuncao(next);
                }

                return new Variavel(new Identificador(next));
            }

            case TokenType.NUMBER: {
                return new Numero(new Integer(next));
            }

            case TokenType.TRUE:
                return new Logico(new Bool(true, next));

            case TokenType.FALSE:
                return new Logico(new Bool(false, next));

            case TokenType.LEFT_PAREN: {
                const expr = this.expressao();

                return new Agrupamento(expr);
            }

            case TokenType.NOT: {
                const fator = this.fator();

                return new Negacao(fator);
            }

            case TokenType.MINUS: {
                const fator = this.fator();

                return new UMinus(fator);
            }

            default:
                throw new UParserError({
                    type: ParserErrorType.MissingExpression,
                    line: this.currentLine,
                });
        }
    }

    private termo() {
        const fatorEsq = this.fator();

        let op: Token | null = null;
        if ((op = this.matchAndMap(matchOpTermo))) {
            const fatorDir = this.fator();

            return new Termo(fatorEsq, op, fatorDir);
        }

        return new Termo(fatorEsq, null, null);
    }

    private condicional() {
        const expr = this.expressao();
        this.consume(TokenType.THEN);
        const comandoThen = this.comando();

        if (this.check(TokenType.ELSE)) {
            this.advance();

            const comandoElse = this.comando();

            return new Condicional(expr, comandoThen, comandoElse);
        }

        return new Condicional(expr, comandoThen, null);
    }

    private repeticao() {
        const expr = this.expressao();
        this.consume(TokenType.DO);
        const comando = this.comando();

        return new Repeticao(expr, comando);
    }

    private leitura() {
        this.consume(TokenType.LEFT_PAREN);
        const identificadores = this.listaIdentificadores();
        this.consume(TokenType.RIGHT_PAREN);

        return new Leitura(identificadores);
    }

    private escrita() {
        this.consume(TokenType.LEFT_PAREN);
        const args = this.listaExpr();
        this.consume(TokenType.RIGHT_PAREN);

        return new Escrita(args);
    }

    private atribuicao(tokenId: Token) {
        const identificador = new Identificador(tokenId);
        this.consume(TokenType.ASSIGNMENT);
        const expr = this.expressao();

        return new Atribuicao(identificador, expr);
    }

    private chamadaProcedimento(tokenId: Token) {
        const identificador = new Identificador(tokenId);
        this.consume(TokenType.LEFT_PAREN);
        if (
            this.check([
                TokenType.IDENTIFIER,
                TokenType.NUMBER,
                TokenType.BOOLEAN,
                TokenType.LEFT_PAREN,
                TokenType.NOT,
                TokenType.MINUS,
            ])
        ) {
            const listaExpr = this.listaExpr();
            this.consume(TokenType.RIGHT_PAREN);
            return new ChamadaProcedimento(identificador, listaExpr);
        }

        this.consume(TokenType.RIGHT_PAREN);
        return new ChamadaProcedimento(identificador, new ListaExpr([]));
    }

    private comando(): Comando {
        const next = this.advance();

        switch (next.type) {
            case TokenType.IF: {
                return this.condicional();
            }

            case TokenType.WHILE: {
                return this.repeticao();
            }

            case TokenType.READ: {
                return this.leitura();
            }

            case TokenType.WRITE: {
                return this.escrita();
            }

            case TokenType.BEGIN: {
                return this.comandoComposto();
            }

            case TokenType.IDENTIFIER: {
                const peek = this.peek();

                if (peek.type === TokenType.ASSIGNMENT) {
                    return this.atribuicao(next);
                }

                if (peek.type === TokenType.LEFT_PAREN) {
                    return this.chamadaProcedimento(next);
                }

                throw new UParserError({
                    type: ParserErrorType.UnexpectedToken,
                    line: this.currentLine,
                    tt: peek.type,
                });
            }

            default:
                throw new UParserError({
                    type: ParserErrorType.MissingExpression,
                    line: this.currentLine,
                });
        }
    }

    private comandoComposto() {
        this.consume(TokenType.BEGIN);

        const comandos: Comando[] = [this.comando()];
        this.consume(TokenType.SEMICOLON);

        while (!this.check(TokenType.END)) {
            comandos.push(this.comando());
            this.consume(TokenType.SEMICOLON);
        }

        this.consume(TokenType.END);

        return new ComandoComposto(comandos);
    }

    private bloco() {
        const secaoDeclVariaveis = this.secaoDeclVariaveis();
        const secaoDeclSubrotinas = this.secaoDeclSubrotinas();
        const comandoComposto = this.comandoComposto();

        return new Bloco(
            comandoComposto,
            secaoDeclVariaveis,
            secaoDeclSubrotinas,
        );
    }

    private identificador(): Identificador {
        let token: Token | null;
        if ((token = this.matchAndMap(matchIdentifier))) {
            return new Identificador(token);
        }

        throw new UParserError({
            type: ParserErrorType.IdentifierExpected,
            line: this.currentLine,
        });
    }

    public parse(): Decl {
        const errors: Error[] = [];

        // TODO sync
        try {
            this.consume(TokenType.PROGRAM);
            const identificador = this.identificador();
            this.consume(TokenType.SEMICOLON);
            const bloco = this.bloco();
            this.consume(TokenType.DOT);
            this.consume(TokenType.EOF);

            return new Programa(identificador, bloco);
        } catch (err) {
            errors.push((err as UParserError).error);
        }

        throw new ParserError(errors);
    }
}
