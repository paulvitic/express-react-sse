import uuid from "./uuid";

const datePrefix = (): string => {
    const now = new Date();
    const d = now.getDate();
    const m = now.getMonth() + 1; //Month from 0 to 11
    const y = now.getFullYear().toString().substr(-2);
    return `${y}${ m<=9 ? '0'+m : m }${ d <= 9 ? '0'+d : d}`;
};

export class Identity {

    private constructor(readonly id: string,
                        readonly name: string | undefined) {
    }

    static from = (id: string, name: string | undefined): Identity => {
        return new Identity(id, name)
    };

    static generate(prefix: string | undefined, name: string | undefined): Identity {
        const id = prefix ? `${prefix}-${datePrefix()}-${uuid()}` : `${datePrefix()}-${uuid()}`;
        return new Identity(id, name);
    }

    equals = (other: Identity) => {
        return this.id === other.id
    };
}
