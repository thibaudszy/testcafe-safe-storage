import assert from 'assert';
import crypto from 'crypto';
import proxyquire from 'proxyquire';
import { SafeStorage, errors } from '../../lib/index.js';


describe('Storage', function () {
    this.timeout(10000);

    it('Should save and load', async () => {
        const storage = new SafeStorage();

        // NOTE: bar should be large enough to detect issues with asymmetric key size restrictions
        const bar = crypto.randomBytes(8000).toString('base64');

        await storage.save({ foo: bar });

        const data: any = await storage.load();

        assert.deepEqual(data.foo, bar);
    });

    it('Should throw an error when validation fails', async () => {
        const storage = new SafeStorage((a: unknown): a is unknown => false);

        await storage.save({ foo: 'bar' });

        try {
            await storage.load();
            throw new Error('This should not be executed');
        }
        catch (error: any) {
            assert.strictEqual(error.code, 1);
            assert.strictEqual(error.message, 'Cannot validate the loaded data. It may be corrupt. Restore the data from backup or regenerate it.');
        }
    });

    describe('tryLoad', () => {
        const { SafeStorage: LocalSafeStorage } = proxyquire('../../lib/index.js', {
            './file.js': {
                load () {
                    throw new errors.SavedDataNotDetected();
                },
            },
        });

        it('Should return undefined value when storage does not exist (default options)', async () => {
            const storage = new LocalSafeStorage();

            const result = await storage.tryLoad();

            assert.strictEqual(result, void 0);
        });

        it('Should suppress errors by a code', async () => {
            const storage = new LocalSafeStorage();

            const result = await storage.tryLoad({ suppress: [errors.CODES.E002] });

            assert.strictEqual(result, void 0);
        });

        it('Should not suppress unexpected errors', async () => {
            const { SafeStorage: VeryLocalSafeStorage } = proxyquire('../../lib/index.js', {
                './file.js': {
                    load () {
                        throw 'foobar';
                    },
                },
            });

            const storage = new VeryLocalSafeStorage();

            try {
                await storage.tryLoad({ suppress: [errors.CODES.E002] });
                throw new Error('This path should throw');
            }
            catch (error: any) {
                assert.strictEqual(error, 'foobar');
            }
        });
    });
});
