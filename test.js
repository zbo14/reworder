'use strict'

/* eslint-env mocha */

const assert = require('assert')
const reworder = require('.')

describe('reworder', () => {
  it('throws if config isn\'t array', () => {
    try {
      reworder({})
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected config to be an array of object literals')
    }
  })

  it('throws if config contains non-object literal', () => {
    try {
      reworder([1])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected config to be an array of object literals')
    }
  })

  it('throws if options isn\'t object literal', () => {
    try {
      reworder([], Object.create(null))
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected options to be an object literal')
    }
  })

  it('throws if options.caseInsensitive isn\'t boolean', () => {
    try {
      reworder([], { caseInsensitive: 1 })
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected options.caseInsensitive to be a boolean')
    }
  })

  it('throws if options.variableSpacing isn\'t boolean', () => {
    try {
      reworder([], { variableSpacing: null })
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

  it('throws if config group isn\'t string or positive number', () => {
    try {
      reworder([{ key: 'foo', group: -1 }])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Config group must be a string or positive integer')
    }
  })

  it('throws if neither config value nor group specified', () => {
    try {
      reworder([{ key: 'foo', foo: 'bar' }])
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Config value or group must be specified')
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

  it('replaces with group instead of hardcoded value', () => {
    const input = 'foo bazbar baz bazbam hello world'
    const reword = reworder([{ key: /baz(bar|bam)/, group: 1 }])
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'bazbar', index: 4, value: 'bar' },
        { key: 'bazbam', index: 15, value: 'bam' }
      ],

      output: 'foo bar baz bam hello world'
    })
  })

  it('replaces with named group instead of hardcoded value', () => {
    const input = 'foo bit bazbarofo baz bazbamfoo hello world'

    const reword = reworder([
      { key: 'bit', value: 'byte' },
      { key: /baz(bar|bam)(?<foolike>foo|oof)/, group: 'foolike' }
    ])

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { key: 'bit', index: 4, value: 'byte' },
        { key: 'bazbamfoo', index: 22, value: 'foo' }
      ],

      output: 'foo byte bazbarofo baz foo hello world'
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
})
