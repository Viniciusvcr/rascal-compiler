import { Token } from '../lexer';
import { Expr, ListaExpr } from './comando';
import { Bool, Identificador, Integer } from './literal';

export enum FatorType {
    Variavel = 1,
    Logico,
    Numero,
    ChamadaFuncao,
    Agrupamento,
    Negacao,
    UMinus,
}

export type Fator =
    | Variavel
    | Numero
    | Logico
    | ChamadaFuncao
    | Agrupamento
    | Negacao
    | UMinus;

export class Variavel {
    type = FatorType.Variavel;

    constructor(public identificador: Identificador) {}
}

export class Numero {
    type = FatorType.Numero;

    constructor(public literal: Integer) {}
}

export class Logico {
    type = FatorType.Logico;

    constructor(public literal: Bool) {}
}

export class ChamadaFuncao {
    type = FatorType.ChamadaFuncao;

    constructor(public identificador: Identificador, public exprs: ListaExpr) {}
}

export class Agrupamento {
    type = FatorType.Agrupamento;

    constructor(public expr: Expr) {}
}

export class Negacao {
    type = FatorType.Negacao;

    constructor(public fator: Fator) {}
}

export class UMinus {
    type = FatorType.UMinus;

    constructor(public fator: Fator) {}
}
