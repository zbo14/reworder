'use strict'

const isObjectLiteral = x => x?.constructor?.name === 'Object'

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

  const patterns = []
  const keyInfos = []

  let index = 0

  for (const key in config) {
    const values = [].concat(config[key])

    for (let value of values) {
      if (value instanceof RegExp) {
        value = value.source
      } else if (typeof value !== 'string') {
        throw new Error('Config value must be string or RegExp')
      }

      patterns.push(`(\\b${value}\\b)`)
      ++index
    }

    keyInfos.push({ key, index })
  }

  const lastIndex = ++index
  const pattern = patterns.join('|')
  const regexOpts = 'g' + (options.caseInsensitive ? 'i' : '')
  const regex = new RegExp(pattern, regexOpts)

  const getKey = index => {
    let i

    for (i = 0; i < keyInfos.length && keyInfos[i].index <= index; i++) {
      if (keyInfos[i].index === index) return keyInfos[i].key
    }

    return keyInfos[Math.max(0, --i)].key
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
