export default interface IError {
    line: number;
    startsAt: number;
    endsAt: number;

    toString(): string;
}
