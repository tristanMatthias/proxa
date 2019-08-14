# Proxa
Composable, observable objects and arrays.

[![npm](https://img.shields.io/npm/v/proxa.svg)](http://npmjs.com/package/proxa)
[![Travis](https://img.shields.io/travis/tristanMatthias/proxa.svg)](https://travis-ci.org/tristanMatthias/proxa)
[![Codecov](https://img.shields.io/codecov/c/github/tristanMatthias/proxa.svg)](https://codecov.io/gh/tristanMatthias/proxa)

## Outline
Proxa is a zero dependency, extremely small library (150 lines) that uses ES6 Proxies to deeply watch objects and arrays.
It uses a callback system that is triggered whenever any property or array element is changed. You can also watch just for a specific property as well.
The beauty of Proxies is that you don't need any fancy interface to work with your state, you can access, update and delete just like any other object or array.

## How it works
Let's take a basic example of a small applications state.

```ts
const state = {
  pages: [],
  auth: {
    loggedIn: false,
    checked: false
  },
  user: null
};
```

We then wrap this in a `proxa` with a callback to observe what's changed (**deeply!**)

```ts
const state = proxa({
  pages: [],
  auth: {
    loggedIn: false,
    checked: false
  },
  user: null
}, (newState, changedProp, newValue) => {
  console.log(`Changed ${changedProp} to ${newValue}`)
  doSomethingWith(newState);
});

// We can access the object normally
console.log(state.pages) // Prints []
console.log(state.auth.loggedIn) // Prints false

// And update it normally too!
state.user = {firstName: 'Bruce', lastName: 'Wayne'};
// Prints 'Changed user to {firstName: 'Bruce', lastName: 'Wayne'}

state.pages.push({title: 'Homepage', html: '...'})
// Prints 'Changed "0" to {title: 'Homepage', html: '...'}
```

### Property observers
Sometimes we only want to observe a particular property on an object. You can do this by passing a third parameter to `proxa`:

```ts
const someObj = proxa(
  { foo: 'bar', lorem: 'ipsum' },
  (newState, prop, value) => {
    console.log('Changed foo prop to', value);
  },
  'foo' // Only watch foo property
);

someObj.lorem = 'something' // Prints nothing
someObj.foo = 'another thing' // Prints 'Changed foo prop to another thing'
```

This works for arrays as well:
```ts
const someArr = proxa(
  ['Hello, ', 'World']
  (newState, prop, value) => {
    console.log(newState.join(''));
  },
  1 // Only watch the second item
);

someArr[0] = 'Greetings, '; // Prints nothing
someArr[1] = 'Batman' // Prints 'Greetings, Batman'
```

### Converting back to plain object
Calling `JSON.stringify(proxa(...))` or `proxa(...).toJSON()` both convert the `proxa` proxy back to a plain object. This is useful for sending via `fetch` to an API for example.

### Nested observing
Proxa deeply converts all objects and arrays to a proxa whenever they're accessed (not on instantiation). This means that you can compose your callbacks into different components or scenarios.

```ts
// state.ts
export const state = proxa({
  pages: [],
  auth: {
    loggedIn: false,
    checked: false
  },
  user: null
});

// user-component.ts
import {state} from './state';

export class UserComponent extends Something {
  constructor() {
    // NOTE: state.user
    this.state = proxa(state.user, () => this.render());
  }

  render() {
    return `<span>My name is, ${this.state.firstname}</span>`;
  }
}

// rotuer-component.ts
import {state} from './state';

export class RouterComponent extends Something {
  constructor() {
    // NOTE: state.auth
    this.state = proxa(state.auth, () => this.render(), 'loggedIn');
  }

  render() {
    if (this.state.loggedIn) return 'You are logged in';
    else return 'You need to login first';
  }
}

```

---

## Contributing
Pull requests and ideas are most welcome. Please send them forward!

## Issues
If you find a bug, please file an issue on [the issue tracker on GitHub](https://github.com/tristanMatthias/proxa/issues).

## Credits
Proxa is built and maintained by [Tristan Matthias](https://www.github.com/tristanMatthias).
