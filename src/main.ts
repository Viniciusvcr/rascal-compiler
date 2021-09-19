import { LexerError, IOError } from './error';
import ParserError from './error/parser';
import { Lexer, readInputFile } from './lexer';
import Parser from './parser/parser';
import util from 'util';

function main() {
    try {
        const sourceCode = readInputFile();
        const lexer = new Lexer(sourceCode);

        const tokens = lexer.scanTokens();

        const parser = new Parser(tokens);
        const stmts = parser.parse();

        console.log(
            util.inspect(stmts, {
                showHidden: false,
                depth: null,
                colors: true,
            }),
        );
    } catch (err) {
        if (
            err instanceof IOError ||
            err instanceof LexerError ||
            err instanceof ParserError
        ) {
            return err.log();
        }

        throw err;
    }
}

main();
