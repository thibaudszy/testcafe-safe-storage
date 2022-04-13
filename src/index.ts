import {
    FILE_TYPE, load, save,
} from './file.js';

import CryptoContext from './crypto.js';


interface Validator<T> {
    (a: unknown): a is T;
}

function defaultValidator<T> (a: unknown): a is T {
    return true;
}

export default class SafeStorage<T> {
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
            throw new Error('E0');

        await this.save(data);

        return data;
    }

    async save (data: T): Promise<void> {
        const buffer = await this._encrypt(Buffer.from(JSON.stringify(data)));

        await save(FILE_TYPE.STORAGE, buffer);
    }
}
