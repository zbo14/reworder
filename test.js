'use strict'

/* eslint-env mocha */

const assert = require('assert')
const reworder = require('.')

describe('reworder', () => {
  it('throws if config contains non-object literal', () => {
    try {
      reworder(1)
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected config to be a non-empty array of object literals')
    }
  })

  it('throws if config is empty', () => {
    try {
      reworder([])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected config to be a non-empty array of object literals')
    }
  })

  it('throws if options isn\'t object literal', () => {
    try {
      reworder({}, Object.create(null))
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected options to be an object literal')
    }
  })

  it('throws if options.caseInsensitive isn\'t boolean', () => {
    try {
      reworder({}, { caseInsensitive: 1 })
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected options.caseInsensitive to be a boolean')
    }
  })

  it('throws if options.includePunctuation isn\'t boolean or punctuation', () => {
    try {
      reworder({}, { includePunctuation: 'not punctuation' })
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected options.includePunctuation to be a boolean or string containing punctuation')
    }
  })

  it('throws if options.variableSpacing isn\'t boolean', () => {
    try {
      reworder({}, { variableSpacing: null })
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected options.variableSpacing to be a boolean')
    }
  })

  it('throws if config key isn\'t string or RegExp', () => {
    try {
      reworder([{ key: 1, value: 'bar' }])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Config key must be string or RegExp')
    }
  })

  it('throws if config value isn\'t string', () => {
    try {
      reworder([{ key: 'foo', value: Symbol('bar') }])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Config value must be a string')
    }
  })

  it('throws if config transform isn\'t function', () => {
    try {
      reworder([{ key: 'foo', transform: 'bar' }])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Config transform must be a function')
    }
  })

  it('throws if config value or transform isn\'t specified', () => {
    try {
      reworder([{ key: 'foo', blah: 'bar' }])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Config value or transform must be specified')
    }
  })

  it('replaces words', () => {
    const input = 'foo bar baz bam hello world'

    const reword = reworder([
      { key: 'foo', value: 'bar' },
      { key: 'bar', value: 'foo' }
    ])

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'foo', index: 0, value: 'bar' },
        { key: 'bar', index: 4, value: 'foo' }
      ],

      output: 'bar foo baz bam hello world'
    })
  })

  it('works with punctuation', () => {
    const input = 'foo! bar? baz bam hello world.'

    const reword = reworder([
      { key: 'foo', value: 'bar' },
      { key: 'bar', value: 'foo' },
      { key: 'hello world', value: 'helloworld' }
    ])

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'foo', index: 0, value: 'bar' },
        { key: 'bar', index: 5, value: 'foo' },
        { key: 'hello world', index: 18, value: 'helloworld' }
      ],

      output: 'bar! foo? baz bam helloworld.'
    })
  })

  it('replaces words (case insensitive)', () => {
    const input = 'foo bAr baz BaM hello world'

    const reword = reworder([
      { key: 'foo', value: 'bar' },
      { key: 'bar', value: 'foo' }
    ], { caseInsensitive: true })

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'foo', index: 0, value: 'bar' },
        { key: 'bAr', index: 4, value: 'foo' }
      ],

      output: 'bar foo baz BaM hello world'
    })
  })

  it('replaces words and phrase', () => {
    const input = 'foo bar baz bam hello world'

    const reword = reworder([
      { key: 'foo', value: 'bar' },
      { key: 'bar', value: 'foo' },
      { key: 'hello world', value: 'helloworld' }
    ])

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'foo', index: 0, value: 'bar' },
        { key: 'bar', index: 4, value: 'foo' },
        { key: 'hello world', index: 16, value: 'helloworld' }
      ],

      output: 'bar foo baz bam helloworld'
    })
  })

  it('replaces with regex', () => {
    const input = 'foo bar baz bam hello world'
    const reword = reworder([{ key: /ba\S*/, value: 'foo' }])
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'bar', index: 4, value: 'foo' },
        { key: 'baz', index: 8, value: 'foo' },
        { key: 'bam', index: 12, value: 'foo' }
      ],

      output: 'foo foo foo foo hello world'
    })
  })

  it('replaces multiple words with single word', () => {
    const input = 'foo bar baz bam hello world'
    const reword = reworder([{ keys: ['bar', 'bam'], value: 'foo' }])
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'bar', index: 4, value: 'foo' },
        { key: 'bam', index: 12, value: 'foo' }
      ],

      output: 'foo foo baz foo hello world'
    })
  })

  it('replaces with regex conntaining subgroups', () => {
    const input = 'foo baz bam bit hello world'
    const reword = reworder([{ key: /b(az|it)*/, value: 'foo' }])
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'baz', index: 4, value: 'foo' },
        { key: 'bit', index: 12, value: 'foo' }
      ],

      output: 'foo foo bam foo hello world'
    })
  })

  it('replaces with regex containing sub-subgroups', () => {
    const input = 'foo bazbar baz bazbam bam bit hello world'
    const reword = reworder([{ key: /b(az(bar|bam)|it)*/, value: 'foo' }])
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'bazbar', index: 4, value: 'foo' },
        { key: 'bazbam', index: 15, value: 'foo' },
        { key: 'bit', index: 26, value: 'foo' }
      ],

      output: 'foo foo baz foo bam foo hello world'
    })
  })

  it('replaces with transform', () => {
    const input = 'foo bazbar baz bazbam bam bit hello world'

    const reword = reworder({
      key: /b(az(bar|bam)|it)*/,
      transform: x => x.slice(-1)
    })

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'bazbar', index: 4, value: 'r' },
        { key: 'bazbam', index: 15, value: 'm' },
        { key: 'bit', index: 26, value: 't' }
      ],

      output: 'foo r baz m bam t hello world'
    })
  })

  it('replaces with async transform', async () => {
    const input = 'foo bazbar baz bazbam bam bit hello world'

    const reword = reworder({
      key: /b(az(bar|bam)|it)*/,
      transform: async x => x.slice(-1)
    })

    const result = await reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'bazbar', index: 4, value: 'r' },
        { key: 'bazbam', index: 15, value: 'm' },
        { key: 'bit', index: 26, value: 't' }
      ],

      output: 'foo r baz m bam t hello world'
    })
  })

  it('handles conflicting values (existing)', () => {
    try {
      reworder([
        { key: /fo\w*?/, value: 'bar' },
        { key: 'foo', value: 'baz' }
      ])

      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Conflict: {/fo\\w*?/: "bar"}, {"foo": "baz"}')
    }
  })

  it('handles conflicting values (new)', () => {
    try {
      reworder([
        { key: 'foo', value: 'bar' },
        { key: /fo\w*?/, value: 'baz' }
      ])

      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Conflict: {"foo": "bar"}, {/fo\\w*?/: "baz"}')
    }
  })

  it('doesn\'t throw on overlapping values', () => {
    reworder([
      { key: 'foo', value: 'bar' },
      { key: 'foofoo', value: 'baz' }
    ])
  })

  it('doesn\'t throw on matching values that don\'t line up', () => {
    reworder([
      { key: /fo./, value: 'bar' },
      { key: 'abcfoo', value: 'baz' }
    ])
  })

  it('replaces with variable spacing', () => {
    const input = 'foo bar baz bam hello   world'

    const reword = reworder([
      { key: 'hello world', value: 'helloworld' }
    ], { variableSpacing: true })

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'hello   world', index: 16, value: 'helloworld' }
      ],

      output: 'foo bar baz bam helloworld'
    })
  })

  it('replaces with punctuation', () => {
    const input = 'foo bar baz bam hello, world'

    const reword = reworder([
      { key: 'hello world', value: 'helloworld' }
    ], { includePunctuation: true })

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'hello, world', index: 16, value: 'helloworld' }
      ],

      output: 'foo bar baz bam helloworld'
    })
  })

  it('replaces with custom punctuation', () => {
    const input = 'foo bar baz bam hello, world|hello. world'

    const reword = reworder([
      { key: 'hello world', value: 'helloworld' }
    ], { includePunctuation: ',' })

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'hello, world', index: 16, value: 'helloworld' }
      ],

      output: 'foo bar baz bam helloworld|hello. world'
    })
  })

  it('replaces words and returns additional properties in matches', () => {
    const input = 'foo bar baz bam hello world'

    const reword = reworder([
      { key: 'foo', value: 'bar', bar: true },
      { key: 'bar', value: 'foo', foo: true }
    ])

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'foo', index: 0, value: 'bar', bar: true },
        { key: 'bar', index: 4, value: 'foo', foo: true }
      ],

      output: 'bar foo baz bam hello world'
    })
  })
})
