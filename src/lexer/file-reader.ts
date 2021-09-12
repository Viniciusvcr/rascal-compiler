import { readFileSync } from 'fs';
import { INPUT_FILENAME, INPUT_FILENAME_ARGV_POS } from '../common/util';
import IOError, { IOErrorType } from '../error/io';

export default function readFile() {
    if (process.argv.length < INPUT_FILENAME_ARGV_POS + 1) {
        throw new IOError({ type: IOErrorType.NoInputFile });
    }

    try {
        return readFileSync(INPUT_FILENAME, 'utf-8');
    } catch (err) {
        throw new IOError({
            type: IOErrorType.NoSuchFile,
            filename: INPUT_FILENAME,
        });
    }
}
