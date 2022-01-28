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
    const string = 'foo bar baz bam hello world'
    const reword = reworder({ bar: 'foo', foo: 'bar' })
    const result = reword(string)

    assert.strictEqual(result, 'bar foo baz bam hello world')
  })

  it('replaces words (case insensitive)', () => {
    const string = 'foo bAr baz BaM hello world'

    const reword = reworder(
      { bar: 'foo', foo: 'bar' },
      { caseInsensitive: true }
    )

    const result = reword(string)

    assert.strictEqual(result, 'bar foo baz BaM hello world')
  })

  it('replaces words and phrase', () => {
    const string = 'foo bar baz bam hello world'

    const reword = reworder({
      bar: 'foo',
      foo: 'bar',
      helloworld: 'hello world'
    })

    const result = reword(string)

    assert.strictEqual(result, 'bar foo baz bam helloworld')
  })

  it('replaces with regex', () => {
    const string = 'foo bar baz bam hello world'
    const reword = reworder({ foo: /ba\S*/ })
    const result = reword(string)

    assert.strictEqual(result, 'foo foo foo foo hello world')
  })

  it('replaces multiple words with single word', () => {
    const string = 'foo bar baz bam hello world'
    const reword = reworder({ foo: ['bar', 'bam'] })
    const result = reword(string)

    assert.strictEqual(result, 'foo foo baz foo hello world')
  })
})
