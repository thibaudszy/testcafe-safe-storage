import assert from 'assert';
import proxyquire from 'proxyquire';


describe('File', () => {
    it('"load" should throw an error when there is no store', async () => {
        const { load, FILE_TYPE } = proxyquire('../../lib/file.js', {
            'fs': {
                promises: {
                    readFile:  () => Promise.resolve(Buffer.from('')),
                    writeFile: () => Promise.resolve(),
                    readdir:   () => Promise.resolve([]),
                    rm:        () => Promise.resolve(),

                },
            },
        });

        try {
            await load(FILE_TYPE.STORAGE);
        }
        catch (error: any) {
            assert.strictEqual(error.code, 2);
            assert.strictEqual(error.message, 'Cannot detect the saved data. Make sure the data was saved before loading.');
        }
    });

    it('"load" should throw an error when the target dir cannot be read', async () => {
        const { load, FILE_TYPE } = proxyquire('../../lib/file.js', {
            'fs': {
                promises: {
                    readFile:  () => Promise.resolve(Buffer.from('')),
                    writeFile: () => Promise.resolve(),
                    rm:        () => Promise.resolve(),

                    readdir: () => Promise.reject(Object.assign(new Error('Does not exist'), { code: 'ENOENT' })),
                },
            },
        });

        try {
            await load(FILE_TYPE.STORAGE);
        }
        catch (error: any) {
            assert.strictEqual(error.code, 2);
            assert.strictEqual(error.message, 'Cannot detect the saved data. Make sure the data was saved before loading.');
        }
    });

    it('"load" should rethrow an exisiting error when there is some other problem with the target dir', async () => {
        const { load, FILE_TYPE } = proxyquire('../../lib/file.js', {
            'fs': {
                promises: {
                    readFile:  () => Promise.resolve(Buffer.from('')),
                    writeFile: () => Promise.resolve(),
                    rm:        () => Promise.resolve(),

                    readdir: () => Promise.reject(Object.assign(new Error('Access denied'), { code: 'EACCESS' })),
                },
            },
        });

        try {
            await load(FILE_TYPE.STORAGE);
        }
        catch (error: any) {
            assert.strictEqual(error.code, 'EACCESS');
            assert.strictEqual(error.message, 'Access denied');
        }
    });

    it('"load" should throw an error when there are multiple stores', async () => {
        const { load, FILE_TYPE } = proxyquire('../../lib/file.js', {
            'fs': {
                promises: {
                    readFile:  () => Promise.resolve(Buffer.from('')),
                    writeFile: () => Promise.resolve(),
                    readdir:   () => Promise.resolve(['storage-1', 'storage-2']),
                    rm:        () => Promise.resolve(),

                },
            },
        });

        try {
            await load(FILE_TYPE.STORAGE);
        }
        catch (error: any) {
            assert.strictEqual(error.code, 3);
            assert.strictEqual(error.message, 'Multiple variants of the saved data detected. Restore the data from backup or regenerate it.');
        }
    });
});
