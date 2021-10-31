export enum SymbolItemType {
    Program = 'program',
    Integer = 'integer',
    Boolean = 'boolean',
    Fun = 'function',
    Procedure = 'procedure',
}

export enum UsableType {
    Integer = 'integer',
    Boolean = 'boolean',
}

interface Program {
    type: SymbolItemType.Program;
}

interface Int {
    type: SymbolItemType.Integer;
}

interface Bool {
    type: SymbolItemType.Boolean;
}

export interface FunProcParams {
    type: UsableType;
    ref: boolean;
}

interface Fun {
    type: SymbolItemType.Fun;
    params: FunProcParams[];
    returnType: UsableType;
}

interface Procedure {
    type: SymbolItemType.Procedure;
    params: FunProcParams[];
}

export type SymbolItem = Program | Int | Bool | Fun | Procedure;

export function fromUsableType(type: UsableType): SymbolItem {
    return type === UsableType.Integer
        ? { type: SymbolItemType.Integer }
        : { type: SymbolItemType.Integer };
}

export function fromSymbolItemType(type: SymbolItemType): UsableType {
    return type === SymbolItemType.Integer
        ? UsableType.Integer
        : UsableType.Boolean;
}

export default class Table<T> {
    private readonly table = new Map<string, T>();

    public insert(id: string, item: T) {
        this.table.set(id, item);
    }

    public get(id: string) {
        return this.table.get(id);
    }

    public has(id: string) {
        return this.table.has(id);
    }
}
