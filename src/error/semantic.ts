import { Logger } from '../common';
import { Placement } from '../lexer/token';
import { UsableType } from '../semantic/symbol-table';
import IError, { errorHeader } from './error';

export enum SemanticErrorType {
    TypeNotDefined,
    AlreadyExists,
    NotDefined,
    ArgsAndParamsLengthNotEqual,
    NotCallable,
    MismatchedTypes,
    ConditionalNotBoolean,
    ExpectedReference,
}

export interface TypeNotDefined {
    type: SemanticErrorType.TypeNotDefined;
    placement: Placement;
    lexeme: string;
}

export interface VariableAlreadyExists {
    type: SemanticErrorType.AlreadyExists;
    placement: Placement;
    lexeme: string;
}

export interface NotDefined {
    type: SemanticErrorType.NotDefined;
    placement: Placement;
    lexeme: string;
}

export interface ArgsAndParamsLengthNotEqual {
    type: SemanticErrorType.ArgsAndParamsLengthNotEqual;
    paramsLength: number;
    argsLength: number;
    callType: 'function' | 'procedure';
    placement: Placement;
}

export interface NotCallable {
    type: SemanticErrorType.NotCallable;
    placement: Placement;
    lexeme: string;
    callType: 'function' | 'procedure';
}

export interface MismatchedTypes {
    type: SemanticErrorType.MismatchedTypes;
    left: UsableType;
    rigth: UsableType;
    placement: Placement;
}

export interface ConditionalNotBoolean {
    type: SemanticErrorType.ConditionalNotBoolean;
    conditionalType: 'if' | 'while';
    placement: Placement;
}

export interface ExpectedReference {
    type: SemanticErrorType.ExpectedReference;
    placement: Placement;
    index: number;
}

export type Error =
    | TypeNotDefined
    | VariableAlreadyExists
    | NotDefined
    | ArgsAndParamsLengthNotEqual
    | NotCallable
    | MismatchedTypes
    | ConditionalNotBoolean
    | ExpectedReference;
export class SemanticError implements IError {
    constructor(private readonly error: Error) {}

    log(): void {
        const logger = new Logger();

        switch (this.error.type) {
            case SemanticErrorType.TypeNotDefined: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `'${this.error.lexeme}' is not a valid rascal type`,
                });
            }

            case SemanticErrorType.AlreadyExists: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `'${this.error.lexeme}' is already declared`,
                });
            }

            case SemanticErrorType.NotDefined: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `'${this.error.lexeme}' is not defined`,
                });
            }

            case SemanticErrorType.ArgsAndParamsLengthNotEqual: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `The number of parameters (${this.error.paramsLength}) differ from the number of arguments (${this.error.argsLength}) on the ${this.error.callType} call`,
                });
            }

            case SemanticErrorType.NotCallable: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `'${this.error.lexeme}' is not a ${this.error.callType}`,
                });
            }

            case SemanticErrorType.MismatchedTypes: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `'${this.error.left}' and '${this.error.rigth}' are not compatible`,
                });
            }

            case SemanticErrorType.ConditionalNotBoolean: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `The ${this.error.conditionalType} conditional does not resolve to a boolean`,
                });
            }

            case SemanticErrorType.ExpectedReference: {
                const prefix = errorHeader(this.error.placement);

                return logger.error({
                    prefix,
                    str: `Expected argument on index ${this.error.index} to be a reference`,
                });
            }
        }
    }
}
