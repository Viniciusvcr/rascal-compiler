import { LexerError, IOError } from './error';
import ParserError from './error/parser';
import { Lexer, readInputFile } from './lexer';
import Parser from './parser/parser';
import util from 'util';
import SemanticAnalyzer from './semantic/semantic';
import { SemanticError } from './error/semantic';

function deepLog(toLog: any) {
    console.log(
        util.inspect(toLog, {
            showHidden: false,
            depth: null,
            colors: true,
        }),
    );
}

function main() {
    try {
        const sourceCode = readInputFile();
        const lexer = new Lexer(sourceCode);

        const tokens = lexer.scanTokens();

        const parser = new Parser(tokens);

        const program = parser.parse();

        const analyzer = new SemanticAnalyzer(program);
        analyzer.analyze();
        // deepLog(program);
    } catch (err) {
        if (
            err instanceof IOError ||
            err instanceof LexerError ||
            err instanceof ParserError ||
            err instanceof SemanticError
        ) {
            return err.log();
        }

        throw err;
    }
}

main();
