import { INPUT_FILENAME } from '../common/util';
import { Placement } from '../lexer/token';

export default interface IError {
    log(): void;
}

export const errorHeader = ({
    line,
    startsAt,
    endsAt,
}: Partial<Placement>): string => {
    return `${INPUT_FILENAME}:${line}${startsAt ? `.${startsAt}` : ''}${
        endsAt ? `.${endsAt}` : ''
    }: Rascal Error: `;
};
