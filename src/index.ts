import {
    FILE_TYPE, load, save,
} from './file.js';

import CryptoContext from './crypto.js';

import * as errors from './errors.js';


type ErrorSuppressor = errors.CODES | Function;

type TryLoadOptions<T> = {
    suppress?: ErrorSuppressor[];
    default?: T;
};

interface Validator<T> {
    (a: unknown): a is T;
}

function defaultValidator<T> (a: unknown): a is T {
    return true;
}

function hasCode(error: unknown): error is { code: unknown } {
    if (typeof error !== 'object' || !error)
        return false;
    
    return 'code' in error;
}

function shouldSuppressError (error: unknown, suppressor: ErrorSuppressor) {    
    if (typeof suppressor === 'function') 
        return error instanceof suppressor;

    if (hasCode(error))
        return error.code === suppressor;
    

    return false;
}

export class SafeStorage<T> {
    constructor (
        private validator: Validator<T> = defaultValidator,
        private cryptoContext: CryptoContext = new CryptoContext()
    ) {
    }

    private async _encrypt (data: Buffer): Promise<Buffer> {
        return this.cryptoContext.encrypt(data);
    }

    private async _decrypt (data: Buffer): Promise<Buffer> {
        return this.cryptoContext.decrypt(data);
    }

    async _safeLoad (): Promise<unknown> {
        const buffer = await load(FILE_TYPE.STORAGE);

        const data = await this._decrypt(buffer);

        return JSON.parse(data.toString());
    }

    async load (): Promise<T> {
        const data = await this._safeLoad();

        if (!this.validator(data))
            throw new errors.LoadedDataInvalid();

        await this.save(data);

        return data;
    }

    async tryLoad<D> (options: TryLoadOptions<D> = { suppress: [errors.SavedDataNotDetected] }) {
        try {
            return await this.load();
        }
        catch (error: unknown) {
            if (options.suppress && options.suppress.some(suppressor => shouldSuppressError(error, suppressor)))
                return options.default;
            
            throw error;
        }
    }

    async save (data: T): Promise<void> {
        const buffer = await this._encrypt(Buffer.from(JSON.stringify(data)));

        await save(FILE_TYPE.STORAGE, buffer);
    }
}

export { errors };
export default SafeStorage;
