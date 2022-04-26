import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { MultipleSavedDataDetected, SavedDataNotDetected } from './errors';


export const STORAGE_DIR = '.tcss';
export const CRYPTO_DIR  = '.tcpk';

export enum FILE_TYPE {
    STORAGE,
    NONCE,
    AUTH_TAG,
    PRIVATE_KEY,
    PASSPHRASE
}

// TODO: Use OS APIs to secretely store PASSPHRASE, AUTH_TAG, NONCE
const FILENAME_TEMPLATES = {
    [FILE_TYPE.STORAGE]:     (seed: string) => path.join(os.homedir(), STORAGE_DIR, `storage-${seed}`),
    [FILE_TYPE.NONCE]:       (seed: string) => path.join(os.homedir(), CRYPTO_DIR, `n-${seed}`),
    [FILE_TYPE.AUTH_TAG]:    (seed: string) => path.join(os.homedir(), CRYPTO_DIR, `at-${seed}`),
    [FILE_TYPE.PRIVATE_KEY]: (seed: string) => path.join(os.homedir(), CRYPTO_DIR, `pk-${seed}`),
    [FILE_TYPE.PASSPHRASE]:  (seed: string) => path.join(os.homedir(), `.tcpp-${seed}`),
};

async function ensureDir (filename: string): Promise<void> {
    await fs.promises.mkdir(path.dirname(filename), { recursive: true });
}

async function detectNames (type: FILE_TYPE): Promise<string[]> {
    const template = FILENAME_TEMPLATES[type]('');
    const dirname  = path.dirname(template);
    const basenames = await fs.promises.readdir(dirname);
    const filenames = basenames.filter(name => name.includes(path.basename(template)));

    return filenames.map(name => path.join(dirname, name));
}

async function detectName (type: FILE_TYPE): Promise<string> {
    const names = await detectNames(type);

    if (!names.length)
        throw new SavedDataNotDetected();

    if (names.length > 1)
        throw new MultipleSavedDataDetected();

    return names[0];
}

async function generateName (type: FILE_TYPE): Promise<string> {
    return FILENAME_TEMPLATES[type](crypto.randomUUID());
}

export async function load (type: FILE_TYPE): Promise<Buffer> {
    const name = await detectName(type);

    const data = await fs.promises.readFile(name);

    await rm(name);

    return data;
}

export async function save (type: FILE_TYPE, data: string | Buffer): Promise<void> {
    const name = await generateName(type);

    await ensureDir(name);
    await rmAll(type);

    await fs.promises.writeFile(name, data);
}

async function rm (name: string): Promise<void> {
    await fs.promises.rm(name, { force: true });
}

async function rmAll (type: FILE_TYPE): Promise<void> {
    const names = await detectNames(type);

    await Promise.all(names.map(name => rm(name)));
}
