'use strict'

const isBoolean = x => typeof x === 'boolean'
const isObjectLiteral = x => (x.constructor || {}).name === 'Object'
const isPositiveInteger = x => Number.isInteger(x) && x > 0
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
  const regexOpts = 'g' + (options.caseInsensitive ? 'i' : '')

  let index = 0
  let isRegex
  let regex

  for (let { key, keys, group, value } of config) {
    if (value && !isString(value)) {
      throw new Error('Config value must be a string')
    }

    if (group && !isString(group) && !isPositiveInteger(group)) {
      throw new Error('Config group must be a string or positive integer')
    }

    if (!value && !group) {
      throw new Error('Config value or group must be specified')
    }

    keys = [].concat(key).concat(keys).filter(Boolean)

    for (let key of keys) {
      if (key instanceof RegExp) {
        isRegex = true
        key = key.source
      } else if (typeof key === 'string') {
        isRegex = false
      } else {
        throw new Error('Config key must be string or RegExp')
      }

      if (options.variableSpacing) {
        key = key.replace(/ /g, ' +')
      }

      regex = new RegExp(`^${key}$`, regexOpts)

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

    infos.push({ group, value, index })
  }

  const lastIndex = ++index
  regex = new RegExp(pattern.join('|'), regexOpts)

  const getInfo = index => {
    let i

    for (i = 0; i < infos.length && infos[i].index <= index; i++) {
      if (infos[i].index === index) break
    }

    return infos[i]
  }

  const reword = input => {
    const matches = []

    let index
    let match
    let net = 0
    let output = input

    while ((match = regex.exec(input))) {
      index = match.slice(1, lastIndex).findIndex(Boolean) + 1
      let { value, group } = getInfo(index)

      if (!value && group) {
        value = isString(group)
          ? match.groups[group]
          : match[index + group]
      }

      index = match.index - net

      output = (
        output.slice(0, index) +
        value +
        output.slice(index + match[0].length)
      )

      matches.push({ key: match[0], index: match.index, value })
      net += match[0].length - value.length
    }

    return { input, matches, output }
  }

  reword.regex = regex

  return reword
}

module.exports = reworder
