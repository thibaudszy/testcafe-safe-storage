type TemplateLambda<T extends ReadonlyArray<unknown>> = (...args: T) => string;

export class Template<T extends ReadonlyArray<unknown>> {
    private template: TemplateLambda<T>;

    protected constructor (t: TemplateLambda<T>) {
        this.template = t;
    }

    static create<T extends ReadonlyArray<unknown>> (x: string | TemplateLambda<T>): Template<T> {
        if (typeof x === 'string')
            return new Template(() => x);

        return new Template(x);
    }

    format (...args: T): string {
        return this.template(...args);
    }
}

export function T <TT extends ReadonlyArray<unknown>> (x: string | TemplateLambda<TT>): Template<TT> {
    return Template.create(x);
}
