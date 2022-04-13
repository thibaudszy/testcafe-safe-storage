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
            assert.match(error.type, /E1/);
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
            assert.match(error.type, /E2/);
        }
    });
});
