
const datePrefix = (): string => {
    const now = new Date();
    const d = now.getDate();
    const m = now.getMonth() + 1; //Month from 0 to 11
    const y = now.getFullYear().toString().substr(-2);
    return `${y}${ m<=9 ? '0'+m : m }${ d <= 9 ? '0'+d : d}`;
};

const uuid = () => {
    let firstPart = (Math.random() * 46656) | 0;
    let secondPart = (Math.random() * 46656) | 0;
    return ("000" + firstPart.toString(36)).slice(-3) +
        ("000" + secondPart.toString(36)).slice(-3);
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
