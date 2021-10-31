import { Nullable } from '../common/util';
import { SemanticError, SemanticErrorType } from '../error/semantic';
import {
    Atribuicao,
    ChamadaProcedimento,
    Comando,
    Condicional,
    Escrita,
    Expr,
    Leitura,
    Repeticao,
} from '../parser/comando';
import {
    Bloco,
    ComandoComposto,
    DeclFuncao,
    DeclProcedimento,
    Programa,
    SecaoDeclSubrotinas,
    SecaoDeclVariaveis,
    Tipo,
} from '../parser/decl';
import { FatorType } from '../parser/fator';
import Scope from './scope';
import {
    fromSymbolItemType,
    fromUsableType,
    FunProcParams,
    SymbolItemType,
    UsableType,
} from './symbol-table';

export default class SemanticAnalyzer {
    private scope = new Scope();

    constructor(private readonly program: Programa) {}

    public analyze() {
        this.scope.addScope();
        this.scope.current.addToSymbolTable(
            this.program.identificador.lexeme!,
            { type: SymbolItemType.Program },
        );

        this.analyzeBloco(this.program.bloco);
    }

    private analyzeBloco(bloco: Bloco) {
        this.analyzeDeclVariaveis(bloco.secaoDeclVariaveis);
        this.analyzeDeclSubrotinas(bloco.secaoDeclSubrotinas);
        this.analyzeComandoComposto(bloco.comandoComposto);
    }

    private analyzeDeclVariaveis(declVariaveis: Nullable<SecaoDeclVariaveis>) {
        if (declVariaveis) {
            const decls = declVariaveis.variaveis;

            for (const { identificadores: idList, tipo } of decls) {
                const type = this.analyzeType(tipo);

                for (const identifier of idList.identificadores) {
                    const lexeme = identifier.lexeme!;

                    if (this.scope.current.existsInSymbolTable(lexeme)) {
                        throw new SemanticError({
                            type: SemanticErrorType.AlreadyExists,
                            lexeme: lexeme,
                            placement: identifier.token.placement,
                        });
                    }

                    this.scope.current.addToSymbolTable(
                        lexeme,
                        type === UsableType.Integer
                            ? { type: SymbolItemType.Integer }
                            : { type: SymbolItemType.Integer },
                    );
                }
            }
        }
    }

    private analyzeType(t: Tipo): UsableType {
        const lexeme = t.identificador.lexeme!;

        if (!this.scope.current.isTypeValid(lexeme)) {
            throw new SemanticError({
                type: SemanticErrorType.TypeNotDefined,
                lexeme,
                placement: t.identificador.token.placement,
            });
        }

        return this.scope.current.getType(lexeme);
    }

    private analyzeDeclSubrotinas(
        declSubrotinas: Nullable<SecaoDeclSubrotinas>,
    ) {
        if (declSubrotinas) {
            const decls = declSubrotinas.declaracoes;

            for (const decl of decls) {
                if (decl instanceof DeclProcedimento) {
                    this.analyzeProcedimento(decl);
                } else {
                    this.analyzeFuncao(decl);
                }
            }
        }
    }

    private analyzeProcedimento(procedure: DeclProcedimento) {
        const lexeme = procedure.identificador.lexeme!;

        if (this.scope.current.existsInSymbolTable(lexeme)) {
            throw new SemanticError({
                type: SemanticErrorType.AlreadyExists,
                lexeme: lexeme,
                placement: procedure.identificador.token.placement,
            });
        }

        this.scope.addScope();
        const formalParams = procedure.parametrosFormais?.declParametros ?? [];
        const params: FunProcParams[] = [];

        for (const param of formalParams) {
            const type = this.analyzeType(param.tipo);

            for (const identifier of param.identificadores.identificadores) {
                const lexeme = identifier.lexeme!;

                params.push({ type, ref: param.ref });
                this.scope.current.addToSymbolTable(
                    lexeme,
                    fromUsableType(type),
                );
            }
        }

        this.analyzeBloco(procedure.bloco);
        this.scope.removeScope();

        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Procedure,
            params,
        });
    }

    private analyzeFuncao(procedure: DeclFuncao) {
        const lexeme = procedure.identificador.lexeme!;

        if (this.scope.current.existsInSymbolTable(lexeme)) {
            throw new SemanticError({
                type: SemanticErrorType.AlreadyExists,
                lexeme: lexeme,
                placement: procedure.identificador.token.placement,
            });
        }

        const retTypeLexeme = procedure.tipoRetorno;
        const returnType = this.analyzeType(retTypeLexeme);

        this.scope.addScope();
        const formalParams = procedure.parametrosFormais?.declParametros ?? [];
        const params: FunProcParams[] = [];

        for (const param of formalParams) {
            const type = this.analyzeType(param.tipo);

            for (const identifier of param.identificadores.identificadores) {
                const lexeme = identifier.lexeme!;

                params.push({ type, ref: param.ref });
                this.scope.current.addToSymbolTable(
                    lexeme,
                    fromUsableType(type),
                );
            }
        }

        this.analyzeBloco(procedure.bloco);
        this.scope.removeScope();

        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Fun,
            params,
            returnType,
        });
    }

    private analyzeComando(command: Comando) {
        if (command instanceof Atribuicao) {
            const lexeme = command.identificador.lexeme!;
            const variable = this.scope.current.getFromSymbolTable(lexeme);

            if (!variable) {
                throw new SemanticError({
                    type: SemanticErrorType.NotDefined,
                    lexeme: lexeme,
                    placement: command.identificador.token.placement,
                });
            }

            const exprType = this.analyzeExpr(command.expr);

            if (fromSymbolItemType(variable.type) !== exprType) {
                throw new SemanticError({
                    type: SemanticErrorType.MismatchedTypes,
                    left: fromSymbolItemType(variable.type),
                    rigth: exprType,
                    placement: command.identificador.token.placement,
                });
            }
        }

        if (command instanceof ChamadaProcedimento) {
            const lexeme = command.identificador.lexeme!;
            const proc = this.scope.current.getFromSymbolTable(lexeme);

            if (!proc) {
                throw new SemanticError({
                    type: SemanticErrorType.NotDefined,
                    lexeme,
                    placement: command.identificador.token.placement,
                });
            }

            if (proc.type !== SymbolItemType.Procedure) {
                throw new SemanticError({
                    type: SemanticErrorType.NotCallable,
                    lexeme,
                    placement: command.identificador.token.placement,
                    callType: 'procedure',
                });
            }

            if (command.args.exprs.length !== proc.params.length) {
                throw new SemanticError({
                    type: SemanticErrorType.ArgsAndParamsLengthNotEqual,
                    argsLength: command.args.exprs.length,
                    paramsLength: proc.params.length,
                    callType: 'procedure',
                    placement: command.identificador.token.placement,
                });
            }

            for (const i in command.args.exprs) {
                console.log('index in ChamadaProcedimento', i);
                const arg = command.args.exprs[i];
                const param = proc.params[i];

                const exprType = this.analyzeExpr(arg);

                if (exprType !== param.type) {
                    throw new SemanticError({
                        type: SemanticErrorType.MismatchedTypes,
                        left: exprType,
                        rigth: param.type,
                        placement: command.identificador.token.placement,
                    });
                }

                if (param.ref && !this.argIsVariable(arg)) {
                    throw new SemanticError({
                        type: SemanticErrorType.ExpectedReference,
                        placement: command.identificador.token.placement,
                        index: +i,
                    });
                }
            }
        }

        if (command instanceof Condicional) {
            const exprType = this.analyzeExpr(command.expr);

            if (exprType !== UsableType.Boolean) {
                throw new SemanticError({
                    type: SemanticErrorType.ConditionalNotBoolean,
                    conditionalType: 'if',
                });
            }

            this.analyzeComando(command.comandoThen);

            if (command.comandoElse) {
                this.analyzeComando(command.comandoElse);
            }
        }

        if (command instanceof Repeticao) {
            const exprType = this.analyzeExpr(command.expr);

            if (exprType !== UsableType.Boolean) {
                throw new SemanticError({
                    type: SemanticErrorType.ConditionalNotBoolean,
                    conditionalType: 'while',
                });
            }

            this.analyzeComando(command.comando);
        }

        if (command instanceof Leitura) {
            for (const id of command.identificadores.identificadores) {
                const lexeme = id.lexeme!;

                if (!this.scope.current.existsInSymbolTable(lexeme)) {
                    throw new SemanticError({
                        type: SemanticErrorType.NotDefined,
                        lexeme,
                        placement: id.token.placement,
                    });
                }
            }
        }

        if (command instanceof Escrita) {
            for (const expr of command.args.exprs) {
                this.analyzeExpr(expr);
            }
        }

        if (command instanceof ComandoComposto) {
            this.analyzeComandoComposto(command);
        }
    }

    private argIsVariable(arg: Expr) {
        return arg.exprEsq.termoEsq.fatorEsq.type === FatorType.Variavel;
    }

    private analyzeComandoComposto(commands: ComandoComposto) {
        for (const command of commands.comandos) {
            this.analyzeComando(command);
        }
    }

    private analyzeExpr(expr: Expr): UsableType {
        throw new Error('Method not implemented');
    }
}
