import Table, { SymbolItem, UsableType } from './symbol-table';

export class ScopeItem {
    private readonly symbolTable = new Table<SymbolItem>();
    private readonly declaredTypes = new Table<UsableType>();

    constructor() {
        this.declaredTypes.insert('integer', UsableType.Integer);
        this.declaredTypes.insert('boolean', UsableType.Boolean);
    }

    addToSymbolTable(id: string, item: SymbolItem) {
        this.symbolTable.insert(id, item);
    }

    getFromSymbolTable(id: string) {
        return this.symbolTable.get(id);
    }

    existsInSymbolTable(id: string) {
        return this.symbolTable.has(id);
    }

    isTypeValid(lexeme: string) {
        return this.declaredTypes.has(lexeme);
    }

    getType(id: string) {
        return this.declaredTypes.get(id)!;
    }
}

export default class Scope {
    private readonly MAX_SCOPE_DEPTH = 2;
    private scopes: ScopeItem[] = [];

    public addScope() {
        if (this.scopes.length < this.MAX_SCOPE_DEPTH) {
            this.scopes.push(new ScopeItem());
        }

        throw new Error('MAX_SCOPE_DEPTH reached');
    }

    public removeScope() {
        return this.scopes.pop();
    }

    get current() {
        return this.scopes[this.scopes.length - 1];
    }
}
