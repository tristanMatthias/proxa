export * from './off';
import * as s from './symbols';

export type ProxaCallback<T> = <P extends keyof T>(newValues: T, prop: keyof T, value: T[P]) => any;

export type ProxyExtended<T> = T & {
  [s.isProxa]: true;
  [s.update](prop: keyof T, value: T[keyof T]): void;
  [s.callbacks]: ProxaCallback<T>[]
  [s.propCallbacks]: Map<keyof T, ProxaCallback<T>[]>
  [s.parent]?: ProxyExtended<any>
  [s.isArray]: boolean;
  toJSON: () => T
};

const excludeProps = [
  s.isProxa,
  s.update,
  s.callbacks,
  s.propCallbacks,
  s.parent,
  s.isArray,
  'toJSON'
];

/**
 * Watches for changes on an object deeply (includes arrays)
 * @param value Object to observe
 * @param cb Callback to return the root object on change
 */
export const proxa = <T extends object>(
  value: T | ProxyExtended<T>,
  cb?: ProxaCallback<T>,
  cbProperty?: keyof T,
  parent?: ProxyExtended<any>
): ProxyExtended<T> => {

  let root: ProxyExtended<T>;

  // Handle proxy getting and setting of properties
  const handler: ProxyHandler<T> = {
    get(target: T, key: keyof T) {
      if (excludeProps.includes(key as string)) return target[key];

      const prop = target[key];

      // If prop is an object, and not currently a proxa wrapped proxy, wrap it
      if (prop && !prop[s.isProxa as keyof typeof prop] && typeof prop === 'object') {
        target[key] = proxa(prop as any, undefined, undefined, root) as unknown as T[keyof T];
      }

      return target[key];
    },

    set<K extends keyof T>(target: ProxyExtended<T>, key: K, value: ProxyExtended<T>[K]) {
      // Don't trigger update if the value hasn't changed
      if (target[key] === value) return true;

      target[key] = value;

      // Update the parent chain
      if (!excludeProps.includes(key as string)) target[s.update](key, value);
      return true;
    }
  };


  // If not a proxy, setup the object as a proxa proxy
  if (!(value as ProxyExtended<T>)[s.isProxa]) {
    // @ts-ignore
    root = new Proxy(value, handler);


    root[s.isProxa] = true;
    root[s.callbacks] = [];
    root[s.propCallbacks] = new Map();

    root[s.update] = (prop: keyof T, value: any) => {
      // Call all the registered callbacks (for every prop)
      root[s.callbacks].forEach(cb => cb(root, prop, value));

      // Call the callbacks that are watching for only this prop
      const propCallbacks = root[s.propCallbacks].get(prop);
      if (propCallbacks) propCallbacks.forEach(cb => cb(root, prop, value));

      // Update the parent chain
      if (root[s.parent]) root[s.parent][s.update]();
    };

    if (parent) root[s.parent] = parent;
    if (value instanceof Array) root[s.isArray] = true;


    // Allows for conversion back into plain JSON, and JSON.stringify(root)
    Object.defineProperty(root, 'toJSON', {
      enumerable: false,
      writable: false,
      value: () => {
        const copy = { ...root };
        excludeProps.forEach(p => delete copy[p as keyof typeof copy]);

        Object.entries(copy).forEach(([key, value]) => {
          // Recursively call toJSON on nested proxa proxies
          if (
            value && typeof value === 'object' && value[s.isProxa]
          ) copy[key as keyof typeof root] = value.toJSON();
        });

        if (root[s.isArray]) {
          return Object.entries(copy).reduce((arr, [key, v]) => {
            // Only add it if the key is the index of the array (only a number)
            if (/^\d+$/.test(key)) (arr as any[]).push(v);
            return arr;
          }, [] as T);
        }

        delete copy.toJSON;
        return copy as T;
      }
    });

  } else {
    root = value as ProxyExtended<T>;
  }


  // Add the callback to the root if it's not included
  if (cb) {
    // Watch ALL properties
    if (!cbProperty && !root[s.callbacks].includes(cb)) root[s.callbacks].push(cb);

    // Only watch specific property
    else if (cbProperty) {
      let cbs = root[s.propCallbacks].get(cbProperty);
      // If property has never been watched before, initialize the array
      if (!cbs) {
        cbs = [];
        root[s.propCallbacks].set(cbProperty, cbs);
      }
      // Add callback to the property map array
      cbs.push(cb);
    }
  }


  return root;
};
