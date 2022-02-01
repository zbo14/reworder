'use strict'

const isObjectLiteral = x => (x.constructor || {}).name === 'Object'

/**
 * @param  {Object} config
 * @param  {Object} options
 *
 * @return {Function}
 */
const reworder = (config, options = {}) => {
  if (!isObjectLiteral(config)) {
    throw new Error('Expected config to be an object literal')
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

  const keyInfos = []
  const pattern = []
  const patterns = []
  const regexOpts = 'g' + (options.caseInsensitive ? 'i' : '')

  let index = 0
  let isRegex
  let regex

  for (const key in config) {
    const values = [].concat(config[key])

    for (let value of values) {
      if (value instanceof RegExp) {
        isRegex = true
        value = value.source.replace(/\(/g, '(?:')
      } else if (typeof value === 'string') {
        isRegex = false
      } else {
        throw new Error('Config value must be string or RegExp')
      }

      regex = new RegExp(value, regexOpts)

      for (const pattern of patterns) {
        if (pattern.regex.test(value) || regex.test(pattern.value)) {
          const patternValue = pattern.isRegex ? `/${pattern.value}/` : `"${pattern.value}"`
          const thisValue = isRegex ? `/${value}/` : `"${value}"`

          throw new Error(
            `Conflict: {${patternValue}: "${pattern.key}"}, {${thisValue}: "${key}"}`
          )
        }
      }

      pattern.push(`(\\b${value}\\b)`)
      patterns.push({ isRegex, key, regex, value })

      ++index
    }

    keyInfos.push({ key, index })
  }

  const lastIndex = ++index
  regex = new RegExp(pattern.join('|'), regexOpts)

  const getKey = index => {
    let i

    for (i = 0; i < keyInfos.length && keyInfos[i].index <= index; i++) {
      if (keyInfos[i].index === index) break
    }

    return keyInfos[i].key
  }

  const reword = input => {
    const matches = []

    let match
    let net = 0
    let output = input

    while ((match = regex.exec(input))) {
      const keyIndex = match.slice(1, lastIndex).findIndex(Boolean) + 1
      const key = getKey(keyIndex)
      const index = match.index - net

      output = (
        output.slice(0, index) +
        key +
        output.slice(index + match[0].length)
      )

      matches.push({ match: match[0], index: match.index, key })
      net += match[0].length - key.length
    }

    return { input, matches, output }
  }

  reword.regex = regex

  return reword
}

module.exports = reworder
