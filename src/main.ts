import { readFileSync } from 'fs';
import { LexerError } from './error';
import Lexer from './lexer/lexer';

function main() {
    const sourceCode = readFileSync('files/test0.pas', 'utf-8');
    const lexer = new Lexer(sourceCode);

    try {
        const tokens = lexer.scanTokens();
        console.log(tokens);
    } catch (err) {
        if (err instanceof LexerError) {
            err.log();
        }
    }
}

main();
