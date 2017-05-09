const arguguard = require('arguguard')
const Nobject = require('nobject')
const Validator = require('arguguard/lib/Validator')
const combinatrics = require('js-combinatorics')
const _ = require('lodash')
const NoFormError = require('./errors/NoForm')
const NoPathError = require('./errors/NoPath')
const ConversionError = require('./errors/Conversion')

const optionsValidator = new Validator('Options', (options) => {
  if (options !== undefined && (options.constr)) {
    throw new Error(`Expected either undefined or pojo, received ${options}`)
  }
})

function CrossConverter(converters, options) {
  arguguard('CrossConverter', ['Nobject', optionsValidator], arguments)
  this.converters = converters
  this.options = options || {}

  const forms = this.forms = []
  const formsObj = this.formsObj = {}
  const formPairs = this.formPairs = []
  const paths = this.paths = this.options.paths || new Nobject()

  converters.forEach((formPair) => {
    paths.set(formPair, formPair)
    formPair.forEach((form) => {
      if (formsObj[form] === true) {
        return
      }
      formsObj[form] = true
      forms.push(form)
    })
  })

  const combinationMethod = forms.length < 31 ? 'combination' : 'bigCombination'
  const combinations = combinatrics[combinationMethod](forms, 2)

  while(pair = combinations.next()) {
    if (!paths.get(pair)) {
      formPairs.push(pair)
    }
    const reversePair = pair.slice(0).reverse()
    if (!paths.get(reversePair)) {
      formPairs.push(reversePair)
    }
  }

  if (this.options.formPairsSort) {
    formPairs.sort(this.options.formPairsSort)
  }

  updatePaths(formPairs, paths, new Nobject, true)
}

CrossConverter.prototype.convert = function convert(truth, formFrom, formTo) {
  arguguard('crossConverter.convert', ['*', 'string', 'string'], arguments)

  if (formFrom === formTo) {
    return truth
  }

  if (this.formsObj[formFrom] !== true || this.formsObj[formTo] !== true) {
    throw new NoFormError(formTo)
  }

  const converter = this.converters.get(formFrom, formTo)
  if (converter) {
    return safeConvert(formFrom, formTo, converter, truth)
  }

  const path = this.paths.get(formFrom, formTo)
  if (path === undefined) {
    throw new NoPathError(formFrom, formTo)
  }

  let currentForm = formFrom
  let currentTruth = truth

  path.forEach((step, index) => {
    if (index === 0) {
      return
    }
    const converter = this.converters.get(currentForm, step)
    currentTruth = safeConvert(currentForm, step, converter, currentTruth)
    currentForm = step
  })

  return currentTruth
}

function updatePaths(formPairs, paths, pathsAttempted, isFirstPass) {

  let isUpdated = false
  const formPairsUnpathed = []

  formPairs.forEach((formPair) => {

    const from = formPair[0]
    const to = formPair[1]
    let isPathFound = false

    if (isFirstPass && paths.get(formPair)) {
      return
    }

    paths.forEach((_formPair, _path) => {

      const isPathAttempted = !isFirstPass && pathsAttempted.get(formPair.concat(_formPair))

      if (isPathAttempted) {
        return
      } else {
        pathsAttempted.set(formPair.concat(_formPair), true)
      }

      const _from = _formPair[0]
      const _to = _formPair[1]

      if (from === _to || _from === to) {
        return
      }

      let pathBetweenFroms
      let pathBetweenTos

      if (from === _from) {
        pathBetweenFroms = [from]
      } else {
        pathBetweenFroms = paths.get(from, _from)
        if (!pathBetweenFroms) {
          return
        }
      }

      if (to === _to) {
        pathBetweenTos = [to]
      } else {
        pathBetweenTos = paths.get(_to, to)
        if (!pathBetweenTos) {
          return
        }
      }

      const path = pathBetweenFroms.concat(_path.slice(1, -1)).concat(pathBetweenTos)

      _.forEach(path, (form, index) => {
        const _index = path.lastIndexOf(form)
        if (path.lastIndexOf(form) !== index) {
          path.splice(index + 1, _index - index)
        }
        return false
      })

      isUpdated = true
      isPathFound = true
      paths.set(formPair, path)
      return false
    })

    if (!isPathFound) {
      formPairsUnpathed.push(formPair)
    }

  })

  if (isUpdated) {
    updatePaths(formPairsUnpathed, paths, pathsAttempted, false)
  }

}

function safeConvert(formFrom, formTo, converter, truth) {
  try {
    return converter(truth)
  } catch (err) {
    throw new ConversionError(truth, formFrom, formTo, err.message)
  }
}

module.exports = CrossConverter
