'use strict'

/* eslint-env mocha */

const assert = require('assert')
const reworder = require('.')

describe('reworder', () => {
  it('throws if config isn\'t object literal', () => {
    try {
      reworder(Object.create(null))
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Expected config to be an object literal')
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

  it('throws if config value isn\'t string or regex', () => {
    try {
      reworder({ bar: Symbol('foo') })
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Config value must be string or RegExp')
    }
  })

  it('replaces words', () => {
    const input = 'foo bar baz bam hello world'
    const reword = reworder({ bar: 'foo', foo: 'bar' })
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { match: 'foo', index: 0, key: 'bar' },
        { match: 'bar', index: 4, key: 'foo' }
      ],

      output: 'bar foo baz bam hello world'
    })
  })

  it('replaces words (case insensitive)', () => {
    const input = 'foo bAr baz BaM hello world'

    const reword = reworder(
      { bar: 'foo', foo: 'bar' },
      { caseInsensitive: true }
    )

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { match: 'foo', index: 0, key: 'bar' },
        { match: 'bAr', index: 4, key: 'foo' }
      ],

      output: 'bar foo baz BaM hello world'
    })
  })

  it('replaces words and phrase', () => {
    const input = 'foo bar baz bam hello world'

    const reword = reworder({
      bar: 'foo',
      foo: 'bar',
      helloworld: 'hello world'
    })

    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { match: 'foo', index: 0, key: 'bar' },
        { match: 'bar', index: 4, key: 'foo' },
        { match: 'hello world', index: 16, key: 'helloworld' }
      ],

      output: 'bar foo baz bam helloworld'
    })
  })

  it('replaces with regex', () => {
    const input = 'foo bar baz bam hello world'
    const reword = reworder({ foo: /ba\S*/ })
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { match: 'bar', index: 4, key: 'foo' },
        { match: 'baz', index: 8, key: 'foo' },
        { match: 'bam', index: 12, key: 'foo' }
      ],

      output: 'foo foo foo foo hello world'
    })
  })

  it('replaces multiple words with single word', () => {
    const input = 'foo bar baz bam hello world'
    const reword = reworder({ foo: ['bar', 'bam'] })
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { match: 'bar', index: 4, key: 'foo' },
        { match: 'bam', index: 12, key: 'foo' }
      ],

      output: 'foo foo baz foo hello world'
    })
  })

  it('replaces with regex with subgroups', () => {
    const input = 'foo baz bam bit hello world'
    const reword = reworder({ foo: /b(az|it)*/ })
    const result = reword(input)

    assert.deepStrictEqual(result, {
      input,

      matches: [
        { match: 'baz', index: 4, key: 'foo' },
        { match: 'bit', index: 12, key: 'foo' }
      ],

      output: 'foo foo bam foo hello world'
    })
  })

  it('handles conflicting values (existing)', () => {
    try {
      reworder({ bar: /fo\w*?/, baz: 'foo' })
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Conflict: {/fo\\w*?/: "bar"}, {"foo": "baz"}')
    }
  })

  it('handles conflicting values (new)', () => {
    try {
      reworder({ bar: 'foo', baz: /fo\w*?/ })
      assert.fail('Should throw')
    } catch (err) {
      assert.strictEqual(err.message, 'Conflict: {"foo": "bar"}, {/fo\\w*?/: "baz"}')
    }
  })

  it('doesn\'t throw on overlapping values', () => {
    reworder({ bar: 'foo', baz: 'foofoo' })
  })

  it('doesn\'t throw on matching values that don\'t line up', () => {
    reworder({ bar: /fo./, baz: 'abcfoo' })
  })
})
