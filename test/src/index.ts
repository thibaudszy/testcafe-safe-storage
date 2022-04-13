import assert from 'assert';
import SafeStorage from '../../lib/index.js';


describe('Storage', function () {
    this.timeout(10000);

    it('Should save and load', async () => {
        const storage = new SafeStorage();

        await storage.save({ foo: 'bar' });

        const data: any = await storage.load();

        assert.deepEqual(data.foo, 'bar');
    });

    it('Should throw an error when validation fails', async () => {
        const storage = new SafeStorage((a: unknown): a is unknown => false);

        await storage.save({ foo: 'bar' });

        try {
            await storage.load();
            throw new Error('This should not be executed');
        }
        catch (error: any) {
            assert.match(error.message, /E0/);
        }
    });
});
