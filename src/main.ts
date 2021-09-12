import { INPUT_FILENAME } from './common/util';
import { LexerError } from './error';
import IOError, { IOErrorType } from './error/io';
import readFile from './lexer/file-reader';
import Lexer from './lexer/lexer';

function main() {
    try {
        const sourceCode = readFile();
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
