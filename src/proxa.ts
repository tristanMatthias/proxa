const sIsProxa = Symbol('proxa');
const sUpdate = Symbol('proxaUpdate');
const sCallbacks = Symbol('proxaCallbacks');
const sPropCallbacks = Symbol('proxaPropCallbacks');
const sParent = Symbol('proxaParent');
const sIsArray = Symbol('proxaIsArray');

export type ProxaCallback<T> = <P extends keyof T>(newValues: T, prop: keyof T, value: T[P]) => any;

export type ProxyExtended<T> = T & {
  [sIsProxa]: true;
  [sUpdate](prop: keyof T, value: T[keyof T]): void;
  [sCallbacks]: ProxaCallback<T>[]
  [sPropCallbacks]: Map<keyof T, ProxaCallback<T>[]>
  [sParent]?: ProxyExtended<any>
  [sIsArray]: boolean;
  toJSON: () => T
};

const excludeProps = [
  sIsProxa,
  sUpdate,
  sCallbacks,
  sPropCallbacks,
  sParent,
  sIsArray,
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
      if (prop && !prop[sIsProxa as keyof typeof prop] && typeof prop === 'object') {
        target[key] = proxa(prop as any, undefined, undefined, root) as unknown as T[keyof T];
      }

      return target[key];
    },

    set<K extends keyof T>(target: ProxyExtended<T>, key: K, value: ProxyExtended<T>[K]) {
      // Don't trigger update if the value hasn't changed
      if (target[key] === value) return true;

      target[key] = value;

      // Update the parent chain
      if (!excludeProps.includes(key as string)) target[sUpdate](key, value);
      return true;
    }
  };


  // If not a proxy, setup the object as a proxa proxy
  if (!(value as ProxyExtended<T>)[sIsProxa]) {
    // @ts-ignore
    root = new Proxy(value, handler);


    root[sIsProxa] = true;
    root[sCallbacks] = [];
    root[sPropCallbacks] = new Map();

    root[sUpdate] = (prop: keyof T, value: any) => {
      // Call all the registered callbacks (for every prop)
      root[sCallbacks].forEach(cb => cb(root, prop, value));

      // Call the callbacks that are watching for only this prop
      const propCallbacks = root[sPropCallbacks].get(prop);
      if (propCallbacks) propCallbacks.forEach(cb => cb(root, prop, value));

      // Update the parent chain
      if (root[sParent]) root[sParent][sUpdate]();
    };

    if (parent) root[sParent] = parent;
    if (value instanceof Array) root[sIsArray] = true;


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
            value && typeof value === 'object' && value[sIsProxa]
          ) copy[key as keyof typeof root] = value.toJSON();
        });

        if (root[sIsArray]) {
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
    if (!cbProperty && !root[sCallbacks].includes(cb)) root[sCallbacks].push(cb);

    // Only watch specific property
    else if (cbProperty) {
      let cbs = root[sPropCallbacks].get(cbProperty);
      // If property has never been watched before, initialize the array
      if (!cbs) {
        cbs = [];
        root[sPropCallbacks].set(cbProperty, cbs);
      }
      // Add callback to the property map array
      cbs.push(cb);
    }
  }


  return root;
};
