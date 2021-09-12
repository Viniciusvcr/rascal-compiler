import { Placement } from '../lexer/token';

export default interface IError {
    line: number;
    startsAt: number;
    endsAt: number;

    toString(): string;
}

export const errorHeader = ({
    line,
    startsAt,
    endsAt,
}: Partial<Placement>): string => {
    return `${process.argv[2]}:${line}${startsAt ? `.${startsAt}` : ''}${
        endsAt ? `.${endsAt}` : ''
    }: Rascal Error: `;
};
