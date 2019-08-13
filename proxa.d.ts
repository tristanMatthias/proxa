declare const sIsProxa: unique symbol;
declare const sUpdate: unique symbol;
declare const sCallbacks: unique symbol;
declare const sPropCallbacks: unique symbol;
declare const sParent: unique symbol;
declare const sIsArray: unique symbol;
export declare type ProxaCallback = <T, P extends keyof T>(newValues: T, prop: keyof T, value: T[P]) => any;
export declare type ProxyExtended<T> = T & {
    [sIsProxa]: true;
    [sUpdate](prop: keyof T, value: T[keyof T]): void;
    [sCallbacks]: ProxaCallback[];
    [sPropCallbacks]: Map<keyof T, ProxaCallback[]>;
    [sParent]?: ProxyExtended<any>;
    [sIsArray]: boolean;
    toJSON: () => T;
};
export declare const proxa: <T extends object>(value: T | ProxyExtended<T>, cb?: ProxaCallback | undefined, cbProperty?: keyof T | undefined, parent?: any) => ProxyExtended<T>;
export {};
