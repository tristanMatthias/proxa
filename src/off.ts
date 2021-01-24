import { Proxa, ProxaCallback } from './proxa';
import * as s from './symbols';

export const off = <T>(
  obj: T,
  cb: ProxaCallback<T>,
  prop?: keyof T
) => {
  const pObj = obj as Proxa<T>;

  // Delete callbacks callback
  if (!prop) {
    const cbIndex = pObj[s.callbacks].indexOf(cb);
    if (cbIndex < 0) throw new Error('Callback does not exist on this object');
    pObj[s.callbacks].splice(cbIndex, 1);

    // Delete propsCallbacks callback
  } else {
    const propCbs = pObj[s.propCallbacks].get(prop);
    if (!propCbs) throw new Error(`Could not find any callbacks for property '${prop}'`);
    const cbIndex = propCbs.indexOf(cb);
    if (cbIndex < 0) throw new Error(`Callback does not exist on property '${prop}' for this object`);
    propCbs.splice(cbIndex, 1);
  }

  return obj;
};
