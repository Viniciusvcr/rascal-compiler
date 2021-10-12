export enum TokenType {
    EOF = 1,
    COMMENT,
    BLANK,
    NEWLINE,

    NUMBER,
    IDENTIFIER,

    LEFT_PAREN,
    RIGHT_PAREN,
    DOT,
    COMMA,
    COLON,
    SEMICOLON,
    PLUS,
    MINUS,
    STAR,
    EQUAL,
    DIFFERENCE,
    GREATER,
    GREATER_EQUAL,
    LESS,
    LESS_EQUAL,
    ASSIGNMENT,

    PROGRAM,
    VAR,
    PROCEDURE,
    FUNCTION,
    BEGIN,
    END,
    FALSE,
    TRUE,
    IF,
    THEN,
    ELSE,
    WHILE,
    DO,
    READ,
    WRITE,
    AND,
    OR,
    NOT,
    DIV,

    INTEGER,
    BOOLEAN,
}

export function toString(tt: TokenType) {
    switch (tt) {
        case TokenType.EOF:
            return 'EOF';
        case TokenType.COMMENT:
            return '';
        case TokenType.BLANK:
            return '';
        case TokenType.NEWLINE:
            return '';
        case TokenType.NUMBER:
            return 'number';
        case TokenType.IDENTIFIER:
            return 'identifier';
        case TokenType.LEFT_PAREN:
            return '(';
        case TokenType.RIGHT_PAREN:
            return ')';
        case TokenType.DOT:
            return '.';
        case TokenType.COMMA:
            return ',';
        case TokenType.COLON:
            return ':';
        case TokenType.SEMICOLON:
            return ';';
        case TokenType.PLUS:
            return '+';
        case TokenType.MINUS:
            return '-';
        case TokenType.STAR:
            return '*';
        case TokenType.EQUAL:
            return '=';
        case TokenType.DIFFERENCE:
            return '<>';
        case TokenType.GREATER:
            return '>';
        case TokenType.GREATER_EQUAL:
            return '>=';
        case TokenType.LESS:
            return '<';
        case TokenType.LESS_EQUAL:
            return '<=';
        case TokenType.ASSIGNMENT:
            return ':=';
        case TokenType.PROGRAM:
            return 'program';
        case TokenType.VAR:
            return 'var';
        case TokenType.PROCEDURE:
            return 'procedure';
        case TokenType.FUNCTION:
            return 'function';
        case TokenType.BEGIN:
            return 'begin';
        case TokenType.END:
            return 'end';
        case TokenType.FALSE:
            return 'false';
        case TokenType.TRUE:
            return 'true';
        case TokenType.IF:
            return 'if';
        case TokenType.THEN:
            return 'then';
        case TokenType.ELSE:
            return 'else';
        case TokenType.WHILE:
            return 'while';
        case TokenType.DO:
            return 'do';
        case TokenType.READ:
            return 'read';
        case TokenType.WRITE:
            return 'write';
        case TokenType.AND:
            return 'and';
        case TokenType.OR:
            return 'or';
        case TokenType.NOT:
            return 'not ';
        case TokenType.DIV:
            return '/';
        case TokenType.INTEGER:
            return 'integer';
        case TokenType.BOOLEAN:
            return 'boolean';
    }
}
