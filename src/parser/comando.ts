import { Nullable } from '../common/util';
import { Token } from '../lexer';
import { ComandoComposto, ListaIdentificadores } from './decl';
import { Fator } from './fator';
import { Identificador } from './literal';

export enum ComandoType {
    Atribuicao = 1,
    ChamadaProcedimento,
    Condicional,
    Repeticao,
    Leitura,
    Escrita,
    ListaExpr,
    Expr,
    ExprSimples,
    Termo,
    ComandoComposto,
}

export type Comando =
    | Atribuicao
    | ChamadaProcedimento
    | Condicional
    | Repeticao
    | Leitura
    | Escrita
    | ComandoComposto;

export class Atribuicao {
    type = ComandoType.Atribuicao;

    constructor(public identificador: Identificador, public expr: Expr) {}
}

export class ChamadaProcedimento {
    type = ComandoType.ChamadaProcedimento;

    constructor(public identificador: Identificador, public args: ListaExpr) {}
}

export class Condicional {
    type = ComandoType.Condicional;

    constructor(
        public expr: Expr,
        public comandoThen: Comando,
        public comandoElse: Nullable<Comando>,
    ) {}
}

export class Repeticao {
    type = ComandoType.Repeticao;

    constructor(public expr: Expr, public comando: Comando) {}
}

export class Leitura {
    type = ComandoType.Leitura;

    constructor(public identificadores: ListaIdentificadores) {}
}

export class Escrita {
    type = ComandoType.Escrita;

    constructor(public args: ListaExpr) {}
}

export class ListaExpr {
    type = ComandoType.ListaExpr;

    constructor(public exprs: Expr[]) {}
}

export class Expr {
    type = ComandoType.Expr;

    constructor(
        public exprEsq: ExprSimples,
        public relacao: Nullable<Token>,
        public exprDir: Nullable<ExprSimples>,
    ) {}
}

export class ExprSimples {
    type = ComandoType.ExprSimples;

    constructor(
        public termoEsq: Termo,
        public op: Nullable<Token>,
        public termoDir: Nullable<Termo>,
    ) {}
}

export class Termo {
    type = ComandoType.Termo;

    constructor(
        public fatorEsq: Fator,
        public op: Nullable<Token>,
        public fatorDir: Nullable<Fator>,
    ) {}
}
