const Nobject = require('nobject')
const combinatrics = require('js-combinatorics')
const _ = require('lodash')
const FormNotStringError = require('./errors/FormNotString')
const NoFormError = require('./errors/NoForm')
const NoPathError = require('./errors/NoPath')
const Q = require('q')

function CrossConverter(converters, options) {
  this.converters = converters
  this.options = _.merge({
    isAsync: false,
    chunkSize: 100,
    chunkWait: 100
  }, options)
  this.isReady = false

  const forms = this.forms = []
  const formsObj = this.formsObj = {}
  const formPairs = this.formPairs = []
  const paths = this.paths = new Nobject()

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
    formPairs.push(pair)
    formPairs.push(pair.slice(0).reverse())
  }

  const pathsAttempted = new Nobject

  if(!this.options.isAsync) {
    updatePaths(formPairs, paths, pathsAttempted, true)
    this.promise = Q.resolve(this)
    this.isReady = true
    return
  }

  const formPairsChunks = _.chunk(formPairs, this.options.chunkSize)
  const deferred = Q.defer()
  this.promise = deferred.promise

  const updatePathsForNextChunk = (formPairsChunks) => {
    const _formPairs = formPairsChunks.pop()
    updatePaths(_formPairs, paths, pathsAttempted, true)

    if (formPairsChunks.length > 0) {
      setTimeout(() => {
        updatePathsForNextChunk(formPairsChunks)
      }, this.options.chunkWait)
    } else {
      this.isReady = true
      deferred.resolve()
    }
  }

  updatePathsForNextChunk(formPairsChunks)

}

CrossConverter.prototype.convert = function convert(truth, formFrom, formTo) {

  if (typeof formFrom !== 'string' || typeof formTo !== 'string') {
    throw new FormNotStringError
  }

  if (formFrom === formTo) {
    return truth
  }

  if (this.formsObj[formFrom] !== true || this.formsObj[formTo] !== true) {
    throw new NoFormError(formTo)
  }

  const converter = this.converters.get(formFrom, formTo)
  if (converter) {
    return converter(truth)
  }

  const path = this.paths.get(formFrom, formTo)
  if (_.isUndefined(path)) {
    throw new NoPathError(formFrom, formTo)
  }

  let currentForm = formFrom
  let currentTruth = truth

  path.forEach((step, index) => {
    if (index === 0) {
      return
    }
    currentTruth = this.converters.get(currentForm, step)(currentTruth)
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

      isUpdated = true
      isPathFound = true
      paths.set(formPair, path)
    })

    if (!isPathFound) {
      formPairsUnpathed.push(formPair)
    }

  })

  if (isUpdated) {
    updatePaths(formPairsUnpathed, paths, pathsAttempted, false)
  }

}

module.exports = CrossConverter
