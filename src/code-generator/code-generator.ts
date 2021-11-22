export default class CodeGenerator {
    private _generatedCode: string[] = [];
    private labelCounter = 0;

    get generatedCode() {
        return this._generatedCode;
    }

    get newLabel() {
        return this.labelCounter++;
    }

    addINPP() {
        this._generatedCode.push('INPP');
    }

    addPARA() {
        this._generatedCode.push('PARA');
    }

    addDSVS(label: string | number) {
        this._generatedCode.push(`DSVS L${label}`);
    }

    addDSFV(label: string | number) {
        this._generatedCode.push(`DSVF L${label}`);
    }

    addAMEM(size: number) {
        this._generatedCode.push(`AMEM ${size}`);
    }

    addDMEM(size: number) {
        this._generatedCode.push(`DMEM ${size}`);
    }

    addLabel(label?: string | number) {
        if (label) {
            this._generatedCode.push(`L${label}: NADA`);

            return label;
        }

        this._generatedCode.push(`L${this.labelCounter++}: NADA`);

        return this.labelCounter;
    }

    addENPR(size: number) {
        this._generatedCode.push(`ENPR ${size}`);
    }

    addRTPR(level: number, size: number) {
        this._generatedCode.push(`RTPR ${level}, ${size}`);
    }

    addCHPR(label: string | number, size: number) {
        this._generatedCode.push(`CHPR L${label}, ${size}`);
    }

    addARMZ(level: number, index: number) {
        this._generatedCode.push(`ARMZ ${level}, ${index}`);
    }

    addLEIT() {
        this._generatedCode.push('LEIT');
    }

    addIMPR() {
        this._generatedCode.push('IMPR');
    }

    addCRVL(level: number, index: number) {
        this._generatedCode.push(`CRVL ${level}, ${index}`);
    }

    addNEGA() {
        this._generatedCode.push('NEGA');
    }

    addINVR() {
        this._generatedCode.push('INVR');
    }

    addCRCT(value: number) {
        this._generatedCode.push(`CRCT ${value}`);
    }

    addSOMA() {
        this._generatedCode.push('SOMA');
    }

    addSUBT() {
        this._generatedCode.push('SUBT');
    }

    addMULT() {
        this._generatedCode.push('MULT');
    }

    addDIVI() {
        this._generatedCode.push('DIVI');
    }

    addCONJ() {
        this._generatedCode.push('CONJ');
    }

    addDISJ() {
        this._generatedCode.push('DISJ');
    }

    addCMIG() {
        this._generatedCode.push('CMIG');
    }

    addCMDG() {
        this._generatedCode.push('CMDG');
    }

    addCMME() {
        this._generatedCode.push('CMME');
    }

    addCMMA() {
        this._generatedCode.push('CMMA');
    }

    addCMEG() {
        this._generatedCode.push('CMEG');
    }

    addCMAG() {
        this._generatedCode.push('CMAG');
    }
}
