import { Color } from './color';

interface Params {
    prefix?: string;
    str: string;
}

export default class Logger {
    log({ prefix, str }: Params) {
        console.log(
            `${prefix && `${Color.WHITE}${prefix}${Color.RESET}`}${
                Color.WHITE
            }${str}${Color.RESET}`,
        );
    }

    error({ prefix, str }: Params) {
        console.log(
            `${prefix && `${Color.WHITE}${prefix}${Color.RESET}`}${
                Color.RED
            }${str}${Color.RESET}`,
        );
    }

    warn({ prefix, str }: Params) {
        console.log(
            `${prefix && `${Color.WHITE}${prefix}${Color.RESET}`}${
                Color.YELLOW
            }${str}${Color.RESET}`,
        );
    }
}
