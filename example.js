const reworder = require('.')

const reword = reworder({
  key: /ba\w/,
  transform: key => key.slice(-1)
})

const input = 'abc foo hello world bar baz'
const result = reword(input)

console.log(result)

// {
//   input: 'abc foo hello world bar baz',
//
//   matches: [
//     { key: 'bar', index: 20, value: 'r' },
//     { key: 'baz', index: 24, value: 'z' }
//   ],
//
//   output: 'abc foo hello world r z'
// }
