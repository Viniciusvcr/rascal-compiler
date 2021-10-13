import { Nullable } from '../common/util';
import { Token } from '../lexer';
import { Comando } from './comando';
import { Identificador } from './literal';

export enum DeclType {
    Programa = 1,
    Bloco,
    SecaoDeclVariaveis,
    DeclVariaveis,
    ListaIdentificadores,
    Tipo,
    SecaoDeclSubrotinas,
    DeclProcedimento,
    DeclFuncao,
    ParametrosFormais,
    DeclParametros,
    ComandoComposto,
}

export type Decl =
    | Programa
    | Bloco
    | SecaoDeclVariaveis
    | DeclVariaveis
    | ListaIdentificadores
    | Tipo
    | SecaoDeclSubrotinas
    | DeclProcedimento
    | DeclFuncao
    | ParametrosFormais
    | DeclParametros
    | ComandoComposto;

export class Programa {
    type = DeclType.Programa;

    constructor(public identificador: Identificador, public bloco: Bloco) {}
}

export class Bloco {
    type = DeclType.Bloco;

    constructor(
        public comandoComposto: ComandoComposto,
        public secaoDeclVariaveis: Nullable<SecaoDeclVariaveis>,
        public secaoDeclSubrotinas: Nullable<SecaoDeclSubrotinas>,
    ) {}
}

export class SecaoDeclVariaveis {
    type = DeclType.SecaoDeclVariaveis;

    constructor(public variaveis: DeclVariaveis[]) {}
}

export class DeclVariaveis {
    type = DeclType.DeclVariaveis;

    constructor(
        public identificadores: ListaIdentificadores,
        public tipo: Tipo,
    ) {}
}

export class ListaIdentificadores {
    type = DeclType.ListaIdentificadores;

    constructor(public identificadores: Identificador[]) {}
}

export class Tipo {
    type = DeclType.Tipo;

    constructor(public identificador: Identificador) {}
}

export class SecaoDeclSubrotinas {
    type = DeclType.SecaoDeclSubrotinas;

    constructor(public declaracoes: Array<DeclProcedimento | DeclFuncao>) {}
}

export class DeclProcedimento {
    type = DeclType.DeclProcedimento;

    constructor(
        public identificador: Identificador,
        public bloco: Bloco,
        public parametrosFormais: Nullable<ParametrosFormais>,
    ) {}
}

export class DeclFuncao {
    type = DeclType.DeclFuncao;

    constructor(
        public identificador: Identificador,
        public tipoRetorno: Tipo,
        public bloco: Bloco,
        public parametrosFormais: Nullable<ParametrosFormais>,
    ) {}
}

export class ParametrosFormais {
    type = DeclType.ParametrosFormais;

    constructor(public declParametros: DeclParametros[]) {}
}

export class DeclParametros {
    type = DeclType.DeclParametros;

    constructor(
        public identificadores: ListaIdentificadores,
        public tipo: Tipo,
    ) {}
}

export class ComandoComposto {
    type = DeclType.ComandoComposto;

    constructor(public comandos: Comando[]) {}
}
