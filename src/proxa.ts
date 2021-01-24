export * from './off';
import * as s from './symbols';

export type ProxaCallback<T> = <P extends keyof T>(newValues: T, prop: keyof T, value: T[P], path: string) => any;
export type ProxaPropertyCallbacks<T> = Map<keyof T, ProxaCallback<T>[]>;


export type Proxa<T> = T & {
  [s.isProxa]: true;
  [s.update](prop: keyof T, value: T[keyof T], path: string): void;
  [s.callbacks]: ProxaCallback<T>[]
  [s.propCallbacks]: ProxaPropertyCallbacks<T>,
  [s.parent]?: Proxa<any>
  [s.parentProperty]?: string;
  [s.isArray]: boolean;
  toJSON: () => T
};


// Do not run the update function if any of these properties change on init
const proxaProps = [
  s.isProxa,
  s.update,
  s.callbacks,
  s.propCallbacks,
  s.parent,
  s.parentProperty,
  s.isArray,
  'toJSON'
];


/**
 * Proxy any object, and setup handler
 * @param value Object to wrap as proxy
 */
const createProxa = <T extends object>(value: T | Proxa<T>): Proxa<T> => {

  // No need to wrap existing proxa in proxa, already setup
  if ((value as Proxa<T>)[s.isProxa]) return value as Proxa<T>;

  // Handle proxy getting and setting of properties
  const handler: ProxyHandler<T> = {
    get(target: T, key: keyof T) {
      if (proxaProps.includes(key as string)) return target[key];

      const prop = target[key];

      // If prop is an object, and not currently a proxa wrapped proxy, wrap it
      if (prop && typeof prop === 'object' && !prop[s.isProxa as keyof typeof prop]) {
        const nested = target[key] = createProxa(prop as any);
        setupProxa(nested, target[key] instanceof Array, root, key as string);
      }

      return target[key];
    },

    set<K extends keyof T>(target: Proxa<T>, key: K, value: Proxa<T>[K]) {
      // Don't trigger update if the value hasn't changed
      if (target[key] === value) return true;

      target[key] = value;

      // Update the root object (and potentially parent chain)
      if (!proxaProps.includes(key as string)) target[s.update](key, value, key as string);
      return true;
    }
  };

  const root = new Proxy(value, handler) as Proxa<T>;
  return root;
}


/**
 * Setup a new proxa Proxy instance
 * @param root Proxa proxy instance
 * @param isArray Is the Proxa an array
 * @param parent Optional parent to bind to
 */
const setupProxa = <T extends object>(
  root: Proxa<T>,
  isArray: boolean,
  parent?: Proxa<any>,
  parentProperty?: string
) => {
  // Skip if already setup
  if (root[s.isProxa]) return;

  // Register the root as a proxa object
  root[s.isProxa] = true;
  // Initialize non-property specific callbacks array
  root[s.callbacks] = [];
  // Initialize property specific callback map
  root[s.propCallbacks] = <ProxaPropertyCallbacks<T>>(new Map());


  /**
   * Handle an update to a property
   * @param prop Property updated
   * @param newValue Value off the new property
   */
  root[s.update] = (prop: keyof T, newValue: any, path: string) => {

    // Call all the registered callbacks (for every prop)
    root[s.callbacks].forEach(cb => cb(root, prop, newValue, path));

    // Call the callbacks that are watching for only this prop
    root[s.propCallbacks].get(prop)?.forEach(cb => cb(root, prop, newValue, path));

    // Update the parent chain
    if (root[s.parent]) {
      (root[s.parent][s.update] as Proxa<any>[typeof s.update])(
        root[s.parentProperty] as keyof T,
        root as any,
        [path, prop].join('.')
      );
    }
  };

  // Setup parent relationship
  if (parent) {
    if (!parentProperty) throw new Error('Unknown parentProperty');
    root[s.parent] = parent;
    root[s.parentProperty] = parentProperty;
  }

  if (isArray) root[s.isArray] = true;


  // Allows for conversion back into plain JSON, and JSON.stringify(root)
  Object.defineProperty(root, 'toJSON', {
    enumerable: false,
    writable: false,
    value: () => {
      const copy = { ...root };
      proxaProps.forEach(p => delete copy[p as keyof typeof copy]);

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
}


/**
 * Add a callback to a Proxa object, and optionally listen on specific properties.
 * @param root Proxa proxy instance
 * @param cb Callback function
 * @param prop Property to watch for
 */
const addCallback = <T>(
  root: Proxa<T>,
  cb: ProxaCallback<T>,
  prop?: keyof T
) => {
  // Watch ALL properties
  if (!prop && !root[s.callbacks].includes(cb)) root[s.callbacks].push(cb);

  // Only watch specific property
  else if (prop) {
    let cbs = root[s.propCallbacks].get(prop);
    // If property has never been watched before, initialize the array
    if (!cbs) {
      cbs = [];
      root[s.propCallbacks].set(prop, cbs);
    }
    // Add callback to the property map array
    cbs.push(cb);
  }
}


/**
 * Watches for changes on an object deeply (includes arrays)
 * @param value Object to observe
 * @param cb Callback to return the root object on change
 */
export const proxa = <T extends object>(
  value: T | Proxa<T>,
  cb?: ProxaCallback<T>,
  cbProperty?: keyof T
): Proxa<T> => {

  let root: Proxa<T>;

  // If not already a proxa proxy, setup the object with update function, etc
  if (!(value as Proxa<T>)[s.isProxa]) {
    root = createProxa(value);
    setupProxa(root, value instanceof Array);
  } else root = value as Proxa<T>;

  // Add the callback to the root if it's not included
  if (cb) addCallback(root, cb, cbProperty);

  return root;
};
