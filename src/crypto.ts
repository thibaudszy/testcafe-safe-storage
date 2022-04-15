import crypto, { KeyObject } from 'crypto';
import { promisify } from 'util';
import {
    FILE_TYPE, load, save,
} from './file.js';


const ASYMMETRIC_KEYS_OPTION = {
    modulusLength: 4096,
};

const PASSPHRASE_SIZE = 32;

type KeyGenResults = {
    passphrase: string;
    privateKey: KeyObject;
    publicKey: KeyObject;
};

class KeyChain {
    public generatePrivateKey (): Promise<KeyObject> {
        return this._load();
    }

    public generatePublicKey (): Promise<KeyObject> {
        return this._generate();
    }

    async _generatePassphrase (): Promise<string> {
        const bytes = await promisify(crypto.randomBytes)(PASSPHRASE_SIZE);

        return bytes.toString('base64');
    }

    async _generateKeyPair (): Promise<KeyGenResults> {
        const passphrase = await this._generatePassphrase();

        const { publicKey, privateKey } = await promisify(crypto.generateKeyPair)('rsa', ASYMMETRIC_KEYS_OPTION);

        return { passphrase, privateKey, publicKey };
    }

    async _loadPassphrase (): Promise<string> {
        const data = await load(FILE_TYPE.PASSPHRASE);

        return data.toString('base64');
    }

    async _savePassphrase (passphrase: string): Promise<void> {
        await save(FILE_TYPE.PASSPHRASE, Buffer.from(passphrase, 'base64'));
    }

    async _loadPrivateKey (passphrase: string): Promise<KeyObject> {
        const data = await load(FILE_TYPE.PRIVATE_KEY);

        return crypto.createPrivateKey({ key: data, format: 'pem', type: 'pkcs8', passphrase });
    }

    async _savePrivateKey (privateKey: KeyObject, passphrase: string): Promise<void> {
        const data = privateKey.export({ format: 'pem', type: 'pkcs8', cipher: 'aes-256-cbc', passphrase });

        await save(FILE_TYPE.PRIVATE_KEY, data);
    }

    async _load (): Promise<KeyObject> {
        const passphrase = await this._loadPassphrase();

        return await this._loadPrivateKey(passphrase);
    }

    async _generate (): Promise<KeyObject> {
        const { passphrase, publicKey, privateKey } = await this._generateKeyPair();

        await this._savePassphrase(passphrase);
        await this._savePrivateKey(privateKey, passphrase);

        return publicKey;
    }
}

export default class CryptoContext {
    constructor (
        private keys: KeyChain = new KeyChain()
    ) {
    }

    async encrypt (data: Buffer): Promise<Buffer> {
        return crypto.publicEncrypt(await this.keys.generatePublicKey(), data);
    }

    async decrypt (data: Buffer): Promise<Buffer> {
        return crypto.privateDecrypt(await this.keys.generatePrivateKey(), data);
    }
}
