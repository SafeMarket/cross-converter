const arguguard = require('arguguard')
const forEach = require('lodash.foreach')
const NoPathError = require('./errors/NoPath')
const NoConverterError = require('./errors/NoConverter')
const ConversionError = require('./errors/Conversion')
const Nobject = require('nobject')


function CrossConverter() {
  arguguard('CrossConverter', [], arguments)
  this.converters = new Nobject
  this.paths = new Nobject
  this.formsObj = {}
}

CrossConverter.prototype.addConverter = function addConverter(from, to, converter) {
  arguguard('crossConverter.addConverter', ['string', 'string', 'function'], arguments)
  const forms = [from, to]
  forms.forEach((form) => {
    if (!this.formsObj[form]) {
      this.formsObj[form] = true
    }
  })
  this.paths.set(from, to, [from, to])
  this.converters.set(from, to, converter)
}

CrossConverter.prototype.addPath = function addPath(path) {
  arguguard('crossConverter.addPath', ['[]string'], arguments)

  path.forEach((form, index) => {
    if (index === 0) {
      return
    }
    const from = path[index - 1]
    const to =form
    if (this.converters.get(from, to) === undefined) {
      throw new NoConverterError(`No converter from form "${from}" to form "${to}"`)
    }
  })
  const from = path[0]
  const to = path[path.length - 1]
  this.paths.set(from, to, path)
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
    throw new NoConverterError(`No converter for form "${formTo}"`)
  }

  const path = this.paths.get(formFrom, formTo)
  if (path === undefined) {
    throw new NoPathError(`No path from "${formFrom}" to "${formTo}"`)
  }

  let currentForm = formFrom
  let currentTruth = truth

  path.forEach((step, index) => {
    if (index === 0) {
      return
    }
    const converter = this.converters.get(currentForm, step)
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
