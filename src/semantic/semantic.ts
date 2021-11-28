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
            { type: SymbolItemType.Program, lexicalLevel: 0, index: 0 },
        );

        this.code.addINPP();
        this.analyzeBloco(this.program.bloco);
        this.code.addDMEM(this.scope.current.allVariablesSize);
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

            let counter = 0;
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
                            ? {
                                  type: SymbolItemType.Integer,
                                  lexicalLevel: this.scope.currentLexicalLevel,
                                  index: counter++,
                              }
                            : {
                                  type: SymbolItemType.Boolean,
                                  lexicalLevel: this.scope.currentLexicalLevel,
                                  index: counter++,
                              },
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
            this.code.addDSVS(this.code.currentLabel());
            const decls = declSubrotinas.declaracoes;

            const subroutineLabel = this.code.newLabel();
            for (const decl of decls) {
                if (decl instanceof DeclProcedimento) {
                    this.analyzeProcedimento(decl, subroutineLabel);
                } else {
                    this.analyzeFuncao(decl, subroutineLabel);
                }
            }
        }
    }

    private analyzeProcedimento(
        procedure: DeclProcedimento,
        subroutineLabel: number,
    ) {
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

        let paramIndex = 0;
        for (const param of formalParams) {
            const type = this.analyzeType(param.tipo);

            for (const identifier of param.identificadores.identificadores) {
                const lexeme = identifier.lexeme;

                params.push({
                    type,
                    ref: param.ref,
                    lexicalLevel: this.scope.currentLexicalLevel,
                    index: -3 - (formalParams.length - paramIndex),
                    isParam: true,
                });
                this.scope.current.addToSymbolTable(
                    lexeme,
                    fromUsableType(
                        type,
                        this.scope.currentLexicalLevel,
                        this.code.currentLabel(),
                    ),
                );
            }

            paramIndex++;
        }
        // Add to current scope for recursion
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Procedure,
            params,
            lexicalLevel: this.scope.currentLexicalLevel,
            index: subroutineLabel,
        });

        this.code.addLabel(this.code.newLabel());
        this.code.addENPR(this.scope.currentLexicalLevel);

        this.analyzeBloco(procedure.bloco);
        this.scope.removeScope(this.code);

        // Add to outside scope for normal calls
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Procedure,
            params,
            lexicalLevel: this.scope.currentLexicalLevel,
            index: subroutineLabel,
        });
    }

    private analyzeFuncao(procedure: DeclFuncao, subroutineLabel: number) {
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

        let paramIndex = 0;
        for (const param of formalParams) {
            const type = this.analyzeType(param.tipo);

            for (const identifier of param.identificadores.identificadores) {
                const lexeme = identifier.lexeme;

                params.push({
                    type,
                    ref: param.ref,
                    lexicalLevel: this.scope.currentLexicalLevel,
                    index: -3 - (formalParams.length - paramIndex),
                    isParam: true,
                });
                this.scope.current.addToSymbolTable(
                    lexeme,
                    fromUsableType(
                        type,
                        this.scope.currentLexicalLevel,
                        this.code.currentLabel(),
                    ),
                );
            }

            paramIndex++;
        }

        // Add to current scope for recursion
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Fun,
            params,
            returnType,
            lexicalLevel: this.scope.currentLexicalLevel,
            index: subroutineLabel,
        });

        this.code.addLabel(this.code.newLabel());
        this.code.addENPR(this.scope.currentLexicalLevel);

        this.analyzeBloco(procedure.bloco);
        this.scope.removeScope(this.code);

        // Add to outside scope for normal calls
        this.scope.current.addToSymbolTable(lexeme, {
            type: SymbolItemType.Fun,
            params,
            returnType,
            lexicalLevel: this.scope.currentLexicalLevel,
            index: subroutineLabel,
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

            if (funcRetAtrib) {
                this.code.addARMZ(
                    this.scope.currentLexicalLevel,
                    -4 - (variable as Fun).params.length,
                );
            } else {
                this.code.addARMZ(
                    this.scope.currentLexicalLevel,
                    variable.index,
                );
            }

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

            this.code.addCHPR(proc.index, this.scope.currentLexicalLevel);
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

            const elseLabel = this.code.newLabel();
            const outOfIfLabel = this.code.newLabel();
            const ifLabel = this.code.newLabel();

            this.code.addDSFV(elseLabel);

            this.analyzeComando(command.comandoThen);

            if (command.comandoElse) {
                this.code.addDSVS(outOfIfLabel);
                this.code.addLabel(elseLabel);
                this.analyzeComando(command.comandoElse);
                this.code.addLabel(outOfIfLabel);
            } else {
                this.code.addLabel(ifLabel);
            }
        }

        if (command instanceof Repeticao) {
            const repeatLabel = this.code.newLabel();
            const outOfWhileLabel = this.code.newLabel();

            this.code.addLabel(repeatLabel);
            const exprType = this.analyzeExpr(command.expr);
            this.code.addDSFV(outOfWhileLabel);

            if (exprType !== UsableType.Boolean) {
                throw new SemanticError({
                    type: SemanticErrorType.ConditionalNotBoolean,
                    conditionalType: 'while',
                    placement: command.expr.placement,
                });
            }

            this.analyzeComando(command.comando);
            this.code.addDSVS(repeatLabel);
            this.code.addLabel(outOfWhileLabel);
        }

        if (command instanceof Leitura) {
            for (const id of command.identificadores.identificadores) {
                this.code.addLEIT();
                const lexeme = id.lexeme;

                if (!this.scope.current.existsInSymbolTable(lexeme)) {
                    throw new SemanticError({
                        type: SemanticErrorType.NotDefined,
                        lexeme,
                        placement: id.token.placement,
                    });
                } else {
                    const variable =
                        this.scope.current.getFromSymbolTable(lexeme)!;

                    this.code.addARMZ(variable.lexicalLevel, variable.index);
                }
            }
        }

        if (command instanceof Escrita) {
            for (const expr of command.args.exprs) {
                this.analyzeExpr(expr);
                this.code.addIMPR();
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

            switch (expr.relacao.type) {
                case TokenType.EQUAL:
                    this.code.addCMIG();
                    break;
                case TokenType.DIFFERENCE:
                    this.code.addCMDG();
                    break;
                case TokenType.LESS:
                    this.code.addCMME();
                    break;
                case TokenType.LESS_EQUAL:
                    this.code.addCMEG();
                    break;
                case TokenType.GREATER:
                    this.code.addCMMA();
                    break;
                case TokenType.GREATER_EQUAL:
                    this.code.addCMAG();
                    break;
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

            switch (expr.op.type) {
                case TokenType.PLUS:
                    this.code.addSOMA();
                    break;
                case TokenType.MINUS:
                    this.code.addSUBT();
                    break;
                case TokenType.OR:
                    this.code.addDISJ();
                    break;
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

            switch (expr.op.type) {
                case TokenType.STAR:
                    this.code.addMULT();
                    break;
                case TokenType.DIV:
                    this.code.addDIVI();
                    break;
                case TokenType.AND:
                    this.code.addCONJ();
                    break;
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

            this.code.addCRVL(symbolItem.lexicalLevel, symbolItem.index);

            return fromSymbolItemType(symbolItem.type);
        }

        if (factor instanceof Numero) {
            this.code.addCRCT(factor.value);
            return UsableType.Integer;
        }

        if (factor instanceof Logico) {
            this.code.addCRCT(Number(factor.value));
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

            this.code.addAMEM(1);

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

            this.code.addCHPR(func.index, this.scope.currentLexicalLevel);
            return func.returnType;
        }

        if (factor instanceof Agrupamento) {
            return this.analyzeExpr(factor.expr);
        }

        if (factor instanceof Negacao) {
            const fator = this.analyzeFator(factor.fator);
            this.code.addNEGA();
            return fator;
        }

        if (factor instanceof UMinus) {
            const fator = this.analyzeFator(factor.fator);
            this.code.addINVR();
            return fator;
        }

        throw Error('not any match in analyzeFator');
    }
}
