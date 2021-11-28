import CodeGenerator from '../code-generator/code-generator';
import { Nullable } from '../common/util';
import { SemanticError, SemanticErrorType } from '../error/semantic';
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
    Repeticao,
    Termo,
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
import {
    Agrupamento,
    ChamadaFuncao,
    Fator,
    FatorType,
    Logico,
    Negacao,
    Numero,
    UMinus,
    Variavel,
} from '../parser/fator';
import Scope from './scope';
import {
    fromSymbolItemType,
    fromUsableType,
    Fun,
    FunProcParams,
    SymbolItemType,
    UsableType,
} from './symbol-table';

export default class SemanticAnalyzer {
    private scope = new Scope();
    private code = new CodeGenerator();

    constructor(private readonly program: Programa) {}

    public analyze() {
        this.scope.addScope();
        this.scope.current.addToSymbolTable(
            this.program.identificador.lexeme!,
            { type: SymbolItemType.Program },
        );

        this.code.addINPP();
        this.analyzeBloco(this.program.bloco);
        this.code.addPARA();

        return this.code.generatedCode;
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
                    const lexeme = identifier.lexeme;

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
                            : { type: SymbolItemType.Boolean },
                    );
                }

                this.code.addAMEM(idList.identificadores.length);
            }
        }
    }

    private analyzeType(t: Tipo): UsableType {
        const lexeme = t.identificador.lexeme;

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
        const lexeme = procedure.identificador.lexeme;

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
                const lexeme = identifier.lexeme;

                params.push({ type, ref: param.ref });
                this.scope.current.addToSymbolTable(
                    lexeme,
                    fromUsableType(type),
                );
            }
        }
        // Add to current scope for recursion
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Procedure,
            params,
        });

        this.analyzeBloco(procedure.bloco);
        this.scope.removeScope();

        // Add to outside scope for normal calls
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Procedure,
            params,
        });
    }

    private analyzeFuncao(procedure: DeclFuncao) {
        const lexeme = procedure.identificador.lexeme;

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
        this.scope.current.currentFunctionAnalyzingName = lexeme;
        const formalParams = procedure.parametrosFormais?.declParametros ?? [];
        const params: FunProcParams[] = [];

        for (const param of formalParams) {
            const type = this.analyzeType(param.tipo);

            for (const identifier of param.identificadores.identificadores) {
                const lexeme = identifier.lexeme;

                params.push({ type, ref: param.ref });
                this.scope.current.addToSymbolTable(
                    lexeme,
                    fromUsableType(type),
                );
            }
        }

        // Add to current scope for recursion
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Fun,
            params,
            returnType,
        });

        this.analyzeBloco(procedure.bloco);
        this.scope.removeScope();

        // Add to outside scope for normal calls
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Fun,
            params,
            returnType,
        });
    }

    private analyzeComando(command: Comando) {
        if (command instanceof Atribuicao) {
            const lexeme = command.identificador.lexeme;
            const funcRetAtrib =
                this.scope.current.currentFunctionAnalyzingName === lexeme;
            const variable = this.scope.current.getFromSymbolTable(lexeme);

            if (!variable) {
                throw new SemanticError({
                    type: SemanticErrorType.NotDefined,
                    lexeme: lexeme,
                    placement: command.identificador.token.placement,
                });
            }

            const exprType = this.analyzeExpr(command.expr);

            let realLeftType = funcRetAtrib
                ? (variable as Fun).returnType
                : fromSymbolItemType(variable.type);

            if (realLeftType !== exprType) {
                throw new SemanticError({
                    type: SemanticErrorType.MismatchedTypes,
                    left: realLeftType,
                    rigth: exprType,
                    placement: command.identificador.token.placement,
                });
            }
        }

        if (command instanceof ChamadaProcedimento) {
            const lexeme = command.identificador.lexeme;
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
                    placement: command.expr.placement,
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
                    placement: command.expr.placement,
                });
            }

            this.analyzeComando(command.comando);
        }

        if (command instanceof Leitura) {
            for (const id of command.identificadores.identificadores) {
                const lexeme = id.lexeme;

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
        const leftType = this.analyzeExprSimples(expr.exprEsq);

        if (expr.relacao) {
            const rightType = this.analyzeExprSimples(expr.exprDir!);

            if (leftType !== rightType) {
                throw new SemanticError({
                    type: SemanticErrorType.MismatchedTypes,
                    left: leftType,
                    rigth: rightType,
                    placement: expr.relacao.placement,
                });
            }

            return UsableType.Boolean;
        }

        return leftType;
    }

    private analyzeExprSimples(expr: ExprSimples): UsableType {
        const leftType = this.analyzeTermo(expr.termoEsq);

        if (expr.op) {
            const rightType = this.analyzeTermo(expr.termoDir!);

            // TODO better error
            if (
                expr.op.type === TokenType.OR &&
                (leftType !== UsableType.Boolean ||
                    rightType !== UsableType.Boolean)
            ) {
                throw new SemanticError({
                    type: SemanticErrorType.MismatchedTypes,
                    left: leftType,
                    rigth: rightType,
                    placement: expr.op.placement,
                });
            }

            if (leftType !== rightType) {
                throw new SemanticError({
                    type: SemanticErrorType.MismatchedTypes,
                    left: leftType,
                    rigth: rightType,
                    placement: expr.op.placement,
                });
            }
        }

        return leftType;
    }

    private analyzeTermo(expr: Termo): UsableType {
        const leftType = this.analyzeFator(expr.fatorEsq);

        if (expr.op) {
            const rightType = this.analyzeFator(expr.fatorDir!);

            // TODO better error
            if (
                expr.op.type === TokenType.AND &&
                (leftType !== UsableType.Boolean ||
                    rightType !== UsableType.Boolean)
            ) {
                throw new SemanticError({
                    type: SemanticErrorType.MismatchedTypes,
                    left: leftType,
                    rigth: rightType,
                    placement: expr.op.placement,
                });
            }

            if (leftType !== rightType) {
                throw new SemanticError({
                    type: SemanticErrorType.MismatchedTypes,
                    left: leftType,
                    rigth: rightType,
                    placement: expr.op.placement,
                });
            }
        }

        return leftType;
    }

    private analyzeFator(factor: Fator): UsableType {
        if (factor instanceof Variavel) {
            const lexeme = factor.identificador;
            const symbolItem = this.scope.current.getFromSymbolTable(lexeme);

            if (!symbolItem) {
                throw new SemanticError({
                    type: SemanticErrorType.NotDefined,
                    lexeme,
                    placement: factor.placement,
                });
            }

            return fromSymbolItemType(symbolItem.type);
        }

        if (factor instanceof Numero) {
            return UsableType.Integer;
        }

        if (factor instanceof Logico) {
            return UsableType.Boolean;
        }

        if (factor instanceof ChamadaFuncao) {
            const lexeme = factor.identificador;
            const func = this.scope.current.getFromSymbolTable(lexeme);

            if (!func) {
                throw new SemanticError({
                    type: SemanticErrorType.NotDefined,
                    lexeme,
                    placement: factor.placement,
                });
            }

            if (func.type !== SymbolItemType.Fun) {
                throw new SemanticError({
                    type: SemanticErrorType.NotCallable,
                    lexeme,
                    placement: factor.placement,
                    callType: 'function',
                });
            }

            if (factor.exprs.exprs.length !== func.params.length) {
                throw new SemanticError({
                    type: SemanticErrorType.ArgsAndParamsLengthNotEqual,
                    argsLength: factor.exprs.exprs.length,
                    paramsLength: func.params.length,
                    callType: 'function',
                    placement: factor.placement,
                });
            }

            for (const i in factor.exprs.exprs) {
                const arg = factor.exprs.exprs[i];
                const param = func.params[i];

                const exprType = this.analyzeExpr(arg);

                if (exprType !== param.type) {
                    throw new SemanticError({
                        type: SemanticErrorType.MismatchedTypes,
                        left: exprType,
                        rigth: param.type,
                        placement: factor.placement,
                    });
                }

                if (param.ref && !this.argIsVariable(arg)) {
                    throw new SemanticError({
                        type: SemanticErrorType.ExpectedReference,
                        placement: factor.placement,
                        index: +i,
                    });
                }
            }

            return func.returnType;
        }

        if (factor instanceof Agrupamento) {
            return this.analyzeExpr(factor.expr);
        }

        if (factor instanceof Negacao) {
            return this.analyzeFator(factor.fator);
        }

        if (factor instanceof UMinus) {
            return this.analyzeFator(factor.fator);
        }

        console.log(factor);
        throw Error('not any match in analyzeFator');
    }
}
