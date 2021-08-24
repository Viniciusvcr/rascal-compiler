import { readFileSync } from 'fs';
import { LexerError } from './error';
import Lexer from './lexer/lexer';

function main() {
    const sourceCode = readFileSync('files/test0.pas', 'ascii');
    const lexer = new Lexer(sourceCode);

    try {
        const tokens = lexer.scanTokens();
        console.log(tokens);
    } catch (err) {
        if (err instanceof LexerError) {
            console.log(err.show());
        }
    }
}

main();
