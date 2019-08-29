export * from './off';
import * as s from './symbols';
export declare type ProxaCallback<T> = <P extends keyof T>(newValues: T, prop: keyof T, value: T[P]) => any;
export declare type ProxyExtended<T> = T & {
    [s.isProxa]: true;
    [s.update](prop: keyof T, value: T[keyof T]): void;
    [s.callbacks]: ProxaCallback<T>[];
    [s.propCallbacks]: Map<keyof T, ProxaCallback<T>[]>;
    [s.parent]?: ProxyExtended<any>;
    [s.isArray]: boolean;
    toJSON: () => T;
};
export declare const proxa: <T extends object>(value: T | ProxyExtended<T>, cb?: ProxaCallback<T> | undefined, cbProperty?: keyof T | undefined, parent?: any) => ProxyExtended<T>;
