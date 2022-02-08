# reworder

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

Replace words and phrases via custom mappings!

## Install

`npm i reworder`

## Usage

**Replace by strings:**

```js
'use strict'

const reworder = require('reword')

const reword = reworder([
  { key: 'foo', value: 'bar' },
  { key: 'bar', value: 'baz' }
])

const input = 'abc foo hello world bar baz'
const result = reword(input)

console.log(result)

// {
//   input: 'abc foo hello world bar baz',
//
//   matches: [
//     { key: 'foo', index: 4, value: 'bar' },
//     { key: 'bar', index: 20, value: 'baz' }
//   ],
//
//   output: 'abc bar hello world baz baz'
// }
```

**Replace by regex:**

```js
const reword = reworder({ key: /ba\w/, value: 'foo' })
const input = 'abc foo hello world bar baz'
const result = reword(input)

console.log(result)

// {
//   input: 'abc foo hello world bar baz',
//
//   matches: [
//     { key: 'bar', index: 20, value: 'foo' },
//     { key: 'baz', index: 24, value: 'foo' }
//   ],
//
//   output: 'abc foo hello world foo foo'
// }
```

**Replace with options:**

```js
const config = [
  { key: 'foo', value: 'bar' },
  { key: 'hello world', value: 'helloworld' }
]

const options = {
  caseInsensitive: true,
  variableSpacing: true
}

const reword = reworder(config, options)
const input = 'abc FoO hello   world bar baz'
const result = reword(input)

console.log(result)

// {
//   input: 'abc FoO hello   world bar baz',
//
//   matches: [
//     { key: 'FoO', index: 4, value: 'bar' },
//     { key: 'hello   world', index: 8, value: 'helloworld' }
//   ],
//
//   output: 'abc bar helloworld bar baz'
// }
```

## Reference

* `config` is an object literal or array of object literals. Each object literal must contain a `key` property (string or RegExp) and `value` (string).
* `options` is an object literal with the following properties:
    * `caseInsensitive` is a boolean indicating whether regex permits case insensitive matching.
    * `variableSpacing` is a boolean indicating whether the regex matches variable number of spaces.

## Test

`npm test`

## Lint

`npm run lint` or `npm run lint:fix`

## License

Licensed under [MIT](./LICENSE).
