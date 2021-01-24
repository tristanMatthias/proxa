import { proxa, off } from '../src/proxa';
import * as s from '../src/symbols';

describe('Instantiation', () => {
  it('should correctly wrap object', () => {
    const obj = proxa({ foo: 'bar', lorem: { ipsum: 'dolor' } });
    expect(obj.foo).toEqual('bar');
    expect(obj.lorem.ipsum).toEqual('dolor');
  });

  it('should correctly wrap array', () => {
    const obj = proxa([{ foo: 'bar' }, 1]);
    // @ts-ignore
    expect(obj[0].foo).toEqual('bar');
    expect(obj[1]).toEqual(1);
  });

  it('should throw error for non array or object', () => {
    expect.assertions(1);
    try {
      // @ts-ignore Force error
      proxa(1);
    } catch (e) {
      expect(e.message).toEqual('Cannot create proxy with a non-object as target or handler');
    }
  });
});


describe('wrapping already wrapped proxa', () => {
  it('should correctly wrap existing proxa', () => {
    const obj = proxa({ foo: 'bar', lorem: { ipsum: 'dolor' } });
    const deep = proxa(obj.lorem);
    expect(deep.ipsum).toEqual('dolor');
  });

  it('should call both callbacks for an existing proxa', async () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();

    const root = proxa({ foo: 'bar', lorem: { ipsum: 'dolor' } });
    const p1 = proxa(root, cb1);
    const p2 = proxa(root, cb2);

    p1.foo = 'updated1';
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(p2.foo).toEqual('updated1');

    p2.foo = 'updated2';
    expect(cb1).toHaveBeenCalledTimes(2);
    expect(cb2).toHaveBeenCalledTimes(2);
    expect(p1.foo).toEqual('updated2');
  });
});


describe('General Callbacks', () => {
  it('should correctly call callback for all changed properties', () => {
    const cb = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: { ipsum: 'dolor' } }, cb);
    obj.foo = 'updated';
    obj.lorem = { ipsum: 'updated' };
    expect(cb).toBeCalledTimes(2);
  });

  it('should correctly call callback for deeply changed properties', () => {
    const cb = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: { ipsum: 'dolor' } }, cb);
    obj.lorem.ipsum = 'updated';
    expect(cb).toBeCalledTimes(1);
  });

  it('should correctly call parent callback for nested proxa', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const parent = proxa({ foo: 'bar', lorem: { ipsum: 'dolor' } }, cb1);
    proxa(parent.lorem, cb2);
    parent.lorem.ipsum = 'updated';
    expect(cb1).toBeCalledTimes(1);
    expect(cb2).toBeCalledTimes(1);
  });

  it('should not update if value set to same value', () => {
    const cb = jest.fn();
    const obj = proxa({ foo: 'bar' }, cb);
    obj.foo = 'updated';
    obj.foo = 'updated';
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should allow adding callback to existing proxa', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const obj = proxa({ foo: 'bar' }, cb1);
    proxa(obj, cb2);
    obj.foo = 'updated';
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('should only allow adding the same callback once', () => {
    const cb = jest.fn();
    const obj = proxa({ foo: 'bar' }, cb);
    proxa(obj, cb);
    obj.foo = 'updated';
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('Property specific callbacks', () => {

  it('should call callback only for property', () => {
    const cb = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' }, cb, 'lorem');
    obj.foo = 'updated';
    obj.lorem = 'updated';
    expect(cb).toBeCalledTimes(1);
  });

  it('should call property callback on nested proxa', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: { ipsum: 'dolor', set: 'amit' } }, cb1);
    proxa(obj.lorem, cb2, 'ipsum');
    obj.foo = 'updated';
    obj.lorem.ipsum = 'updated';
    obj.lorem.set = 'updated';
    expect(cb1).toBeCalledTimes(3);
    expect(cb2).toBeCalledTimes(1);
  });

  it('should allow adding property callback to existing proxa', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const cb3 = jest.fn();
    const cb4 = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' }, cb1);
    proxa(obj, cb2, 'foo');
    proxa(obj, cb3, 'foo');
    proxa(obj, cb4, 'lorem');
    obj.foo = 'updated';
    obj.lorem = 'updated';
    expect(cb1).toBeCalledTimes(2);
    expect(cb2).toBeCalledTimes(1);
    expect(cb3).toBeCalledTimes(1);
    expect(cb4).toBeCalledTimes(1);
  });
});


describe('toJSON', () => {
  it('should return json from object proxa', () => {
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' });
    expect(JSON.stringify(obj)).toEqual('{"foo":"bar","lorem":"ipsum"}');
  });

  it('should return json from array proxa', () => {
    const obj = proxa([1, { foo: 'bar' }]);
    expect(JSON.stringify(obj)).toEqual('[1,{"foo":"bar"}]');
  });

  it('should ignore non array elements', () => {
    const obj = proxa([1, { foo: 'bar' }]);
    // @ts-ignore
    obj.test = 1;
    expect(JSON.stringify(obj)).toEqual('[1,{"foo":"bar"}]');
  });
});


describe('off() general callback', () => {

  it('should correctly remove callback', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' }, cb1);
    proxa(obj, cb2);
    obj.foo = 'updated';
    off(obj, cb1);
    obj.foo = 'again';
    expect(cb1).toBeCalledTimes(1);
    expect(cb2).toBeCalledTimes(2);
  });

  it('should throw error removing callback that is not assigned to object', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' }, cb1);
    try {
      off(obj, cb2);
    } catch (e) {
      expect(e.message).toEqual('Callback does not exist on this object');
    }
  });
});


describe('off() property callback', () => {

  it('should correctly remove callback', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' }, cb1, 'foo');
    proxa(obj, cb2);
    obj.foo = 'updated';
    off(obj, cb1, 'foo');
    obj.foo = 'again';
    expect(cb1).toBeCalledTimes(1);
    expect(cb2).toBeCalledTimes(2);
  });

  it('should throw error removing callback that is not assigned to property on object', () => {
    const cb1 = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' }, cb1, 'foo');
    off(obj, cb1, 'foo');
    try {
      off(obj, cb1, 'foo');
    } catch (e) {
      expect(e.message).toEqual(`Callback does not exist on property 'foo' for this object`);
    }
  });

  it('should throw error removing callback for property with no callbacks', () => {
    const cb1 = jest.fn();
    const obj = proxa({ foo: 'bar', lorem: 'ipsum' }, cb1, 'foo');
    try {
      off(obj, cb1, 'lorem');
    } catch (e) {
      expect(e.message).toEqual(`Could not find any callbacks for property 'lorem'`);
    }
  });
});


describe('Parent callbacks', () => {
  it('should call parent callback on nested property change', () => {
    const obj = { foo: 'bar', lorem: 'ipsum', nested: { dolor: 'set' } }
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const parent = proxa(obj, cb1);
    const child = proxa(parent.nested, cb2);
    child.dolor = 'amit';
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('should call parent callback on nested property change', () => {
    const obj = [0, 1, [2, 3]];
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const parent = proxa(obj, cb1);
    const child = proxa(parent[2] as number[], cb2);
    child[2] = 4;
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
