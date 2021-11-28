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

interface CodeGeneratorProps {
    index: number;
    lexicalLevel: number;
    isParam?: boolean;
}

interface Program extends CodeGeneratorProps {
    type: SymbolItemType.Program;
}

interface Int extends CodeGeneratorProps {
    type: SymbolItemType.Integer;
}

interface Bool extends CodeGeneratorProps {
    type: SymbolItemType.Boolean;
}

export interface FunProcParams extends CodeGeneratorProps {
    type: UsableType;
    ref: boolean;
}

export interface Fun extends CodeGeneratorProps {
    type: SymbolItemType.Fun;
    params: FunProcParams[];
    returnType: UsableType;
}

export interface Procedure extends CodeGeneratorProps {
    type: SymbolItemType.Procedure;
    params: FunProcParams[];
}

export type SymbolItem = Program | Int | Bool | Fun | Procedure;

export function fromUsableType(
    type: UsableType,
    index: number,
    lexicalLevel: number,
): SymbolItem {
    return type === UsableType.Integer
        ? { type: SymbolItemType.Integer, index, lexicalLevel }
        : { type: SymbolItemType.Integer, index, lexicalLevel };
}

export function fromSymbolItemType(type: SymbolItemType): UsableType {
    return type === SymbolItemType.Integer
        ? UsableType.Integer
        : UsableType.Boolean;
}

export default class Table<T> {
    private readonly table = new Map<string, T>();

    get size() {
        return this.table.size;
    }

    get allAsArray() {
        return [...this.table.values()];
    }

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
