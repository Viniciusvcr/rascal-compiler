import { LexerError, IOError } from './error';
import { Lexer, readInputFile } from './lexer';

function main() {
    try {
        const sourceCode = readInputFile();
        const lexer = new Lexer(sourceCode);

        const tokens = lexer.scanTokens();
        console.log(tokens);
    } catch (err) {
        if (err instanceof LexerError || err instanceof IOError) {
            err.log();
        }
    }
}

main();
