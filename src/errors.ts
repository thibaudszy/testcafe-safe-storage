import * as TEXTS from './texts.js';
import { Template } from './utils/template.js';


export enum CODES {
    E001 = 1,
    E002,
    E003
}

type RAU = ReadonlyArray<unknown>;

abstract class BaseError<T extends ReadonlyArray<unknown>> extends Error {
    public abstract code: CODES;
    public abstract template: Template<T>;
    private args: T;

    public constructor (...args: T) {
        super();
        
        this.name = new.target.name;
        this.args = args;
    }

    public get message () {
        return this.template.format(...this.args);
    }
}

export class LoadedDataInvalid<T extends RAU> extends BaseError<T> {
    code = CODES.E001;
    template = TEXTS.LOADED_DATA_INVALID;
}


export class SavedDataNotDetected<T extends RAU> extends BaseError<T> {
    code = CODES.E002;
    template = TEXTS.SAVED_DATA_NOT_DETECTED;
}

export class MultipleSavedDataDetected<T extends RAU> extends BaseError<T> {
    code = CODES.E003;
    template = TEXTS.MULTIPLE_SAVED_DATA_DETECTED;
}
