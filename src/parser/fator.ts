import { Token } from '../lexer';
import { Placement } from '../lexer/token';
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

    constructor(public _identificador: Identificador) {}

    get placement(): Placement {
        return this._identificador.token.placement;
    }

    get identificador() {
        return this._identificador.lexeme!;
    }
}

export class Numero {
    type = FatorType.Numero;

    constructor(public literal: Integer) {}

    get placement(): Placement {
        return this.literal.token.placement;
    }

    get value() {
        return this.literal.literal;
    }
}

export class Logico {
    type = FatorType.Logico;

    constructor(public literal: Bool) {}

    get placement(): Placement {
        return this.literal.token.placement;
    }

    get value() {
        return this.literal.literal;
    }
}

export class ChamadaFuncao {
    type = FatorType.ChamadaFuncao;

    constructor(
        public _identificador: Identificador,
        public exprs: ListaExpr,
    ) {}

    get placement(): Placement {
        return this._identificador.token.placement;
    }

    get identificador() {
        return this._identificador.lexeme!;
    }
}

export class Agrupamento {
    type = FatorType.Agrupamento;

    constructor(public expr: Expr) {}

    get placement(): Placement {
        return this.expr.placement;
    }
}

export class Negacao {
    type = FatorType.Negacao;

    constructor(public fator: Fator) {}

    get placement(): Placement {
        return this.fator.placement;
    }
}

export class UMinus {
    type = FatorType.UMinus;

    constructor(public fator: Fator) {}

    get placement(): Placement {
        return this.fator.placement;
    }
}
