import { Color } from './color';

export default class Logger {
    log(str: string) {
        console.log(`${Color.WHITE}${str}${Color.RESET}`);
    }

    error(str: string) {
        console.log(`${Color.RED}${str}${Color.RESET}`);
    }

    warn(str: string) {
        console.log(`${Color.YELLOW}${str}${Color.RESET}`);
    }
}
