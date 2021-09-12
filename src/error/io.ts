import { Logger } from '../common';
import IError from './error';

export enum IOErrorType {
    NoInputFile,
    NoSuchFile,
}

export interface NoInputFile {
    type: IOErrorType.NoInputFile;
}

export interface NoSuchFileError {
    type: IOErrorType.NoSuchFile;
    filename: string;
}

export type Error = NoSuchFileError | NoInputFile;

export default class IOError implements IError {
    constructor(public readonly error: Error) {}

    log(): void {
        const logger = new Logger();

        switch (this.error.type) {
            case IOErrorType.NoInputFile: {
                logger.error({
                    str: 'Missing file input',
                });

                return logger.log({ str: '\nUsage: ./rascalc <filename>' });
            }

            case IOErrorType.NoSuchFile: {
                return logger.error({
                    str: `Cannot open file "${this.error.filename}"`,
                });
            }
        }
    }
}
