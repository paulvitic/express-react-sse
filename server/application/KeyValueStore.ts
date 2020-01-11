export interface KeyValueStore<KEY, VALUE> {

    set(key: KEY, value: VALUE): void;

    get(key: KEY): Promise<VALUE>;
}
