class BaseError extends Error {
    public readonly type: string;

    constructor (message: string, type: string) {
        super(message);

        this.type = type;
    }
}

export class LoadedDataInvalid extends BaseError {
    constructor () {
        super('Cannot validate the loaded data. It may be corrupt. Restore the data from backup or regenerate it.', 'E0');
    }
}

export class SavedDataNotDetected extends BaseError {
    constructor () {
        super('Cannot detect the saved data. Make sure the data was saved before loading.', 'E1');
    }
}

export class MultipleSavedDataNotDetected extends BaseError {
    constructor () {
        super('Multiple variants of the saved data detected. Restore the data from backup or regenerate it.', 'E2');
    }
}
