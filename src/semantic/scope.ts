import { Nullable } from '../common/util';
import Table, {
    fromUsableType,
    Fun,
    Procedure,
    SymbolItem,
    UsableType,
} from './symbol-table';

export class ScopeItem {
    private readonly symbolTable = new Table<SymbolItem>();
    private readonly declaredTypes = new Table<UsableType>();
    private _currentFunctionAnalyzingName: Nullable<string> = null;

    constructor(private readonly parentScope: Nullable<ScopeItem>) {
        this.declaredTypes.insert('integer', UsableType.Integer);
        this.declaredTypes.insert('boolean', UsableType.Boolean);
    }

    addToSymbolTable(id: string, item: SymbolItem) {
        this.symbolTable.insert(id, item);
    }

    getFromSymbolTable(id: string): Nullable<SymbolItem> {
        const symbol = this.symbolTable.get(id);

        if (!symbol && this.parentScope) {
            return this.parentScope.getFromSymbolTable(id);
        }

        return symbol ?? null;
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

    set currentFunctionAnalyzingName(id: Nullable<string>) {
        this._currentFunctionAnalyzingName = id;
    }

    get currentFunctionAnalyzingName() {
        return this._currentFunctionAnalyzingName;
    }
}

export default class Scope {
    private readonly MAX_SCOPE_DEPTH = 2;
    private scopes: ScopeItem[] = [];

    public addScope() {
        if (this.scopes.length < this.MAX_SCOPE_DEPTH) {
            return this.scopes.push(new ScopeItem(this.current));
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
