'use strict'

const isObjectLiteral = x => (x.constructor || {}).name === 'Object'

const reworder = (config, options = {}) => {
  if (!Array.isArray(config) || !config.every(isObjectLiteral)) {
    throw new Error('Expected config to be an array of object literals')
  }

  if (!isObjectLiteral(options)) {
    throw new Error('Expected options to be an object literal')
  }

  if (
    options.caseInsensitive !== undefined &&
    typeof options.caseInsensitive !== 'boolean'
  ) {
    throw new Error('Expected options.caseInsensitive to be a boolean')
  }

  const infos = []
  const pattern = []
  const patterns = []
  const regexOpts = 'g' + (options.caseInsensitive ? 'i' : '')

  let index = 0
  let isRegex
  let regex

  for (let { key, keys, value } of config) {
    if (typeof value !== 'string') {
      throw new Error('Config value must be string')
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

    infos.push({ value, index })
  }

  const lastIndex = ++index
  regex = new RegExp(pattern.join('|'), regexOpts)

  const getValue = index => {
    let i

    for (i = 0; i < infos.length && infos[i].index <= index; i++) {
      if (infos[i].index === index) break
    }

    return infos[i].value
  }

  const reword = input => {
    const matches = []

    let index
    let match
    let net = 0
    let output = input

    while ((match = regex.exec(input))) {
      index = match.slice(1, lastIndex).findIndex(Boolean) + 1
      const value = getValue(index)
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
