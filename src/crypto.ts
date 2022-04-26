import crypto, { BinaryLike, Cipher, CipherGCM, Decipher, DecipherGCM, KeyObject } from 'crypto';
import { promisify } from 'util';
import {
    FILE_TYPE, load, save,
} from './file.js';

const ASYMMETRIC_KEYS_ALGO   = 'rsa';
const ASYMMETRIC_KEYS_CIPHER = 'aes-256-cbc';
const ASYMMETRIC_KEYS_LENGTH = 4096;

const ASYMMETRIC_KEYS_FORMAT = {
    format: 'pem',
    type:   'pkcs8'
} as const;

const SYMMETRIC_ALGO = 'aes-256-gcm';

// NOTE: AES-256 requires a 256 bit key. 256 bits === 32 bytes
const PASSPHRASE_SIZE = 32;

type KeyPair = {
    privateKey: KeyObject;
    publicKey:  KeyObject;
};

type EncryptionContext = {
    nonce:      Buffer;
    passphrase: Buffer;
};

type DecryptionContext = EncryptionContext & {
    authTag: Buffer;
};

const generateKeyPair = promisify(crypto.generateKeyPair);
const randomBytes     = promisify(crypto.randomBytes);
const scrypt          = promisify<BinaryLike, BinaryLike, number, Buffer>(crypto.scrypt);

export default class CryptoContext {
    async _generateNonce () {
        return await randomBytes(PASSPHRASE_SIZE);
    }

    async _generateKeyPair (): Promise<KeyPair> {
        return await generateKeyPair(ASYMMETRIC_KEYS_ALGO, { modulusLength: ASYMMETRIC_KEYS_LENGTH });
    }

    async _generatePassphrase (nonce: Buffer): Promise<Buffer> {
        const bytes = await randomBytes(PASSPHRASE_SIZE);

        return await scrypt(bytes, nonce, PASSPHRASE_SIZE);
    }

    private async _saveNonce(nonce: Buffer) {
        await save(FILE_TYPE.NONCE, nonce);
    }

    async _savePrivateKey (privateKey: KeyObject, nonce: Buffer): Promise<void> {
        const data = privateKey.export({ cipher: ASYMMETRIC_KEYS_CIPHER, passphrase: nonce, ...ASYMMETRIC_KEYS_FORMAT });

        await save(FILE_TYPE.PRIVATE_KEY, data);
    }

    async _savePassphrase (passphrase: Buffer, publicKey: KeyObject): Promise<void> {
        await save(FILE_TYPE.PASSPHRASE, crypto.publicEncrypt(publicKey, passphrase));
    }

    async _saveAuthTag (authTag: Buffer) {
        await save(FILE_TYPE.AUTH_TAG, authTag);
    }

    async _loadAuthTag () {
        return await load(FILE_TYPE.AUTH_TAG);
    }

    private async _loadNonce() {
        return await load(FILE_TYPE.NONCE);
    }

    async _loadPrivateKey (nonce: Buffer): Promise<KeyObject> {
        const data = await load(FILE_TYPE.PRIVATE_KEY);

        return crypto.createPrivateKey({ key: data, passphrase: nonce, ...ASYMMETRIC_KEYS_FORMAT });
    }

    async _loadPassphrase (privateKey: KeyObject): Promise<Buffer> {
        const data = await load(FILE_TYPE.PASSPHRASE);

        return crypto.privateDecrypt(privateKey, data);
    }

    async _generateEncryptionKeys (): Promise<EncryptionContext> {
        const nonce      = await this._generateNonce();
        const passphrase = await this._generatePassphrase(nonce);

        const { publicKey, privateKey } = await this._generateKeyPair();

        await this._saveNonce(nonce);
        await this._savePrivateKey(privateKey, nonce);
        await this._savePassphrase(passphrase, publicKey);

        return { nonce, passphrase };
    }

    async _loadDecryptionKeys (): Promise<DecryptionContext> {
        const authTag    = await this._loadAuthTag();
        const nonce      = await this._loadNonce();
        const privateKey = await this._loadPrivateKey(nonce);
        const passphrase = await this._loadPassphrase(privateKey);

        return { authTag, nonce, passphrase };
    }

    private async _createCipher (): Promise<CipherGCM> {
        const { nonce, passphrase } = await this._generateEncryptionKeys();

        return crypto.createCipheriv(SYMMETRIC_ALGO, passphrase, nonce);
    }

    private async _createDecipher (): Promise<DecipherGCM> {
        const { nonce, passphrase, authTag } = await this._loadDecryptionKeys();

        const decipher = await crypto.createDecipheriv(SYMMETRIC_ALGO, passphrase, nonce);

        decipher.setAuthTag(authTag);

        return decipher;
    }

    async encrypt (data: Buffer): Promise<Buffer> {
        const cipher = await this._createCipher();

        const result = Buffer.concat([cipher.update(data), cipher.final()]);

        await this._saveAuthTag(cipher.getAuthTag());

        return result;
    }

    async decrypt (data: Buffer): Promise<Buffer> {
        const decipher = await this._createDecipher();

        return Buffer.concat([decipher.update(data), decipher.final()]);
    }
}
