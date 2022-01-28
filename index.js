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

  const reword = string => {
    let match
    let net = 0
    let result = string

    while ((match = regex.exec(string))) {
      const index = match.slice(1, lastIndex).findIndex(Boolean) + 1
      const key = getKey(index)

      result = (
        result.slice(0, match.index - net) +
        key +
        result.slice(match.index - net + match[0].length)
      )

      net += match[0].length - key.length
    }

    return result
  }

  reword.regex = regex

  return reword
}

module.exports = reworder
