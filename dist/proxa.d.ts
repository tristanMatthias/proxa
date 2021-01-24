export * from './off';
import * as s from './symbols';
export declare type ProxaCallback<T> = <P extends keyof T>(newValues: T, prop: keyof T, value: T[P], path: string) => any;
export declare type ProxaPropertyCallbacks<T> = Map<keyof T, ProxaCallback<T>[]>;
export declare type Proxa<T> = T & {
    [s.isProxa]: true;
    [s.update](prop: keyof T, value: T[keyof T], path: string): void;
    [s.callbacks]: ProxaCallback<T>[];
    [s.propCallbacks]: ProxaPropertyCallbacks<T>;
    [s.parent]?: Proxa<any>;
    [s.parentProperty]?: string;
    [s.isArray]: boolean;
    toJSON: () => T;
};
export declare const proxa: <T extends object>(value: T | Proxa<T>, cb?: ProxaCallback<T> | undefined, cbProperty?: keyof T | undefined) => Proxa<T>;
