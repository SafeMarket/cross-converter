const arguguard = require('arguguard')
const forEach = require('lodash.foreach')
const NoPathError = require('./errors/NoPath')
const NoConverterError = require('./errors/NoConverter')
const ConversionError = require('./errors/Conversion')

function pojoGet(pojo, from, to) {
  if (pojo[from] === undefined) {
    return undefined
  }
  return pojo[from][to]
}

function pojoSet(pojo, from, to, thing) {
  if (pojo[from] === undefined) {
    pojo[from] = {}
  }
  pojo[from][to] = thing
}

function CrossConverter() {
  arguguard('CrossConverter', [], arguments)
  this.converters = {}
  this.formsObj = {}
  this.paths = {}
}

CrossConverter.prototype.addConverter = function addConverter(from, to, converter) {
  arguguard('crossConverter.addConverter', ['string', 'string', 'function'], arguments)
  const forms = [from, to]
  forms.forEach((form) => {
    if (!this.formsObj[form]) {
      this.formsObj[form] = true
    }
  })
  pojoSet(this.paths, from, to, [from, to])
  pojoSet(this.converters, from, to, converter)
}

CrossConverter.prototype.addPath = function addPath(path) {
  arguguard('crossConverter.addPath', ['[]string'], arguments)

  path.forEach((form, index) => {
    if (index === 0) {
      return
    }
    const from = path[index - 1]
    const to =form
    if (pojoGet(this.converters, from, to) === undefined) {
      throw new NoConverterError(`No converter from form "${from}" to form "${to}"`)
    }
  })
  const from = path[0]
  const to = path[path.length - 1]
  pojoSet(this.paths, from, to, path)
}

CrossConverter.prototype.convert = function convert(truth, formFrom, formTo) {
  arguguard('crossConverter.convert', ['*', 'string', 'string'], arguments)

  if (formFrom === formTo) {
    return truth
  }

  if (this.formsObj[formFrom] !== true) {
    throw new NoConverterError(`No converter for form "${formFrom}"`)
  }

  if (this.formsObj[formTo] !== true) {
    throw new NoConverterError(`No converter for form "${formFrom}"`)
  }

  const path = pojoGet(this.paths, formFrom, formTo)
  if (path === undefined) {
    throw new NoPathError(`No path from "${formFrom}" to "${formTo}"`)
  }

  let currentForm = formFrom
  let currentTruth = truth

  path.forEach((step, index) => {
    if (index === 0) {
      return
    }
    const converter = pojoGet(this.converters, currentForm, step)
    if (converter === undefined) {
      throw new NoConverterError(`No converter from form "${currentForm}" to "${step}"`)
    }
    currentTruth = safeConvert(currentForm, step, converter, currentTruth)
    currentForm = step
  })

  return currentTruth
}

function safeConvert(formFrom, formTo, converter, truth) {
  try {
    return converter(truth)
  } catch (err) {
    throw new ConversionError(truth, formFrom, formTo, err.message)
  }
}

module.exports = CrossConverter
