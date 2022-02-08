'use strict'

const isBoolean = x => typeof x === 'boolean'
const isFunction = x => typeof x === 'function'
const isObjectLiteral = x => (x.constructor || {}).name === 'Object'
const isString = x => typeof x === 'string'
const isUndefined = x => typeof x === 'undefined'

const reworder = (config, options = {}) => {
  config = [].concat(config).filter(Boolean)

  if (!config.length || !config.every(isObjectLiteral)) {
    throw new Error('Expected config to be a non-empty array of object literals')
  }

  if (!isObjectLiteral(options)) {
    throw new Error('Expected options to be an object literal')
  }

  if (
    !isUndefined(options.caseInsensitive) &&
    !isBoolean(options.caseInsensitive)
  ) {
    throw new Error('Expected options.caseInsensitive to be a boolean')
  }

  if (
    !isUndefined(options.variableSpacing) &&
    !isBoolean(options.variableSpacing)
  ) {
    throw new Error('Expected options.variableSpacing to be a boolean')
  }

  const infos = []
  const pattern = []
  const patterns = []
  const regexOptions = 'g' + (options.caseInsensitive ? 'i' : '')

  let index = 0
  let isRegex
  let regex

  for (let { key, keys, value, transform, ...rest } of config) {
    if (value && !isString(value)) {
      throw new Error('Config value must be a string')
    }

    if (transform && !isFunction(transform)) {
      throw new Error('Config transform must be a function')
    }

    if (!value && !transform) {
      throw new Error('Config value or transform must be specified')
    }

    keys = [].concat(key).concat(keys).filter(Boolean)

    for (let key of keys) {
      if (key instanceof RegExp) {
        isRegex = true
        key = key.source.replace(/\(/g, '(?:')
      } else if (typeof key === 'string') {
        isRegex = false
      } else {
        throw new Error('Config key must be string or RegExp')
      }

      if (options.variableSpacing) {
        key = key.replace(/ /g, ' +')
      }

      regex = new RegExp(`^${key}$`, regexOptions)

      for (const pattern of patterns) {
        const isConflict = (
          (pattern.isRegex && pattern.regex.test(key)) ||
          (isRegex && regex.test(pattern.key))
        )

        if (isConflict) {
          const patternKey = pattern.isRegex ? `/${pattern.key}/` : `"${pattern.key}"`
          const thisKey = isRegex ? `/${key}/` : `"${key}"`

          throw new Error(
            `Conflict: {${patternKey}: "${pattern.value}"}, {${thisKey}: "${value}"}`
          )
        }
      }

      pattern.push(`(\\b${key}\\b)`)
      patterns.push({ isRegex, key, regex, value })

      ++index
    }

    infos.push({ ...rest, value, transform, index })
  }

  const lastInfoIndex = ++index
  regex = new RegExp(pattern.join('|'), regexOptions)

  const getInfo = index => {
    let i

    for (i = 0; i < infos.length && infos[i].index <= index; i++) {
      if (infos[i].index === index) break
    }

    return infos[i]
  }

  const reword = input => {
    const matches = []
    const promises = []

    let match
    let net = 0
    let output = input

    const handleMatch = (key, index, value, rest) => {
      const adjustedIndex = index - net

      output = (
        output.slice(0, adjustedIndex) +
        value +
        output.slice(adjustedIndex + key.length)
      )

      matches.push({ ...rest, key, index, value })
      net += key.length - value.length
    }

    while ((match = regex.exec(input))) {
      const key = match[0]
      const index = match.index
      const infoIndex = match.slice(1, lastInfoIndex).findIndex(Boolean) + 1

      let { value, transform, ...rest } = getInfo(infoIndex)
      value = value || transform(match[0])

      if (value instanceof Promise) {
        const promise = value.then(value => ({ ...rest, key, index, value }))
        promises.push(promise)
      } else {
        handleMatch(key, index, value, rest)
      }
    }

    if (!promises.length) return { input, matches, output }

    return Promise.all(promises).then(results => {
      for (const { key, index, value } of results) {
        handleMatch(key, index, value)
      }

      return { input, matches, output }
    })
  }

  reword.regex = regex

  return reword
}

module.exports = reworder
