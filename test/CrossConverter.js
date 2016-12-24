const Nobject = require('nobject')
const CrossConverter = require('../')
const chai = require('chai')
const FormNotStringError = require('../errors/FormNotString')
const NoFormError = require('../errors/NoForm')
const NoPathError = require('../errors/NoPath')
const _ = require('lodash')

chai.should()

const converters = new Nobject()
converters.set('meters', 'centimeters', (meters) => {
  return meters * 100
})
converters.set('centimeters', 'meters', (centimeters) => {
  return centimeters / 100
})
converters.set('meters', 'kilometers', (meters) => {
  return meters / 1000
})
converters.set('kilometers', 'meters', (kilometers) => {
  return kilometers * 1000
})
converters.set('decimeters', 'centimeters', (decimeters) => {
  return decimeters * 10
})
converters.set('centimeters', 'decimeters', (centmeters) => {
  return centmeters / 10
})
converters.set('pounds', 'ounces', (pounds) => {
  return pounds * 16
})

converters.set('ounces', 'pounds', (ounces) => {
  return ounces / 16
})

describe('CrossConverter (sync)', () => {

  let crossConverter

  it('should instantiate', () => {
    crossConverter = new CrossConverter(converters)
  })

  it('should have 6 forms', () => {
    crossConverter.forms.length.should.equal(6)
  })

  describe('errors', () => {

    it('null formFrom should throw FormNotStringError', () => {
      (() => {
        crossConverter.convert(1, 'meters', null)
      }).should.throw(FormNotStringError)
    })

    it('null formTo should throw FormNotStringError', () => {
      (() => {
        crossConverter.convert(1, null, 'meters')
      }).should.throw(FormNotStringError)
    })

    it('"feet" formFrom should throw NoFormError', () => {
      (() => {
        crossConverter.convert(1, 'feet', 'meters')
      }).should.throw(NoFormError)
    })

    it('"feet" formTo should throw NoFormError', () => {
      (() => {
        crossConverter.convert(1, 'meters', 'feet')
      }).should.throw(NoFormError)
    })

    it('should throw NoPathError', () => {
      (() => {
        crossConverter.convert(1, 'meters', 'pounds')
      }).should.throw(NoPathError)
    })

  })

  describe('convert', () => {
    it('should return input when forms are the same', () => {
      crossConverter.convert(1, 'meters', 'meters').should.equal(1)
    })
  })

  describe('convert', () => {
    it('should return input when forms are the same', () => {
      crossConverter.convert(1, 'meters', 'meters').should.equal(1)
    })

    it('should convert pounds to ounces', () => {
      crossConverter.convert(1, 'pounds', 'ounces').should.equal(16)
    })

    it('should convert ounces to pounds', () => {
      crossConverter.convert(16, 'ounces', 'pounds').should.equal(1)
    })

    it('should convert kilometers to decimeters', () => {
      crossConverter.convert(1, 'kilometers', 'decimeters').should.equal(1000 * 10)
    })
  })

})

describe('CrossConverter (async)', () => {

  let crossConverter

  it('should instantiate', () => {
    crossConverter = new CrossConverter(converters, {
      isAsync: true
    })
    return crossConverter.promise
  })

  it('should have 6 forms', () => {
    crossConverter.forms.length.should.equal(6)
  })

  describe('errors', () => {

    it('null formFrom should throw FormNotStringError', () => {
      (() => {
        crossConverter.convert(1, 'meters', null)
      }).should.throw(FormNotStringError)
    })

    it('null formTo should throw FormNotStringError', () => {
      (() => {
        crossConverter.convert(1, null, 'meters')
      }).should.throw(FormNotStringError)
    })

    it('"feet" formFrom should throw NoFormError', () => {
      (() => {
        crossConverter.convert(1, 'feet', 'meters')
      }).should.throw(NoFormError)
    })

    it('"feet" formTo should throw NoFormError', () => {
      (() => {
        crossConverter.convert(1, 'meters', 'feet')
      }).should.throw(NoFormError)
    })

    it('should throw NoPathError', () => {
      (() => {
        crossConverter.convert(1, 'meters', 'pounds')
      }).should.throw(NoPathError)
    })

  })

  describe('convert', () => {
    it('should return input when forms are the same', () => {
      crossConverter.convert(1, 'meters', 'meters').should.equal(1)
    })
  })

  describe('convert', () => {
    it('should return input when forms are the same', () => {
      crossConverter.convert(1, 'meters', 'meters').should.equal(1)
    })

    it('should convert pounds to ounces', () => {
      crossConverter.convert(1, 'pounds', 'ounces').should.equal(16)
    })

    it('should convert ounces to pounds', () => {
      crossConverter.convert(16, 'ounces', 'pounds').should.equal(1)
    })

    it('should convert kilometers to decimeters', () => {
      crossConverter.convert(1, 'kilometers', 'decimeters').should.equal(1000 * 10)
    })
  })

})

describe('big combo (10)', () => {

  const converters = new Nobject
  _.range(10).forEach((index) => {
    converters.set(index + '', index + 1 + '', (little) => {
      return little + 1
    })
    converters.set(index + 1 + '', index + '', (big) => {
      return big - 1
    })
  })

  describe('sync', () => {

    let crossConverter

    it('should instantiate', () => {
      crossConverter = new CrossConverter(converters)
    })

    it('should be ready', () => {
      crossConverter.isReady.should.equal(true)
    })

    it('should convert 0 to 10 and 10 to 0', () => {
      crossConverter.convert(0, '0', '10').should.equal(10)
      crossConverter.convert(0, '10', '0').should.equal(-10)
    })
  })

  describe('async', () => {
    it('should instantiate', () => {
      crossConverter = new CrossConverter(converters, { isAsync: true })
    })

    it('should be NOT be ready', () => {
      crossConverter.isReady.should.equal(false)
    })

    it('should wait for promise', () => {
      return crossConverter.promise
    })

    it('should be ready', () => {
      crossConverter.isReady.should.equal(true)
    })

    it('should convert 0 to 32 and 32 to 0', () => {
      crossConverter.convert(0, '0', '10').should.equal(10)
      crossConverter.convert(0, '10', '0').should.equal(-10)
    })
  })

})

describe('big combo (32)', () => {

  const converters = new Nobject
  _.range(32).forEach((index) => {
    converters.set(index + '', index + 1 + '', (little) => {
      return little + 1
    })
    converters.set(index + 1 + '', index + '', (big) => {
      return big - 1
    })
  })

  describe('sync', () => {

    let crossConverter

    it('should instantiate', () => {
      crossConverter = new CrossConverter(converters)
    })

    it('should be ready', () => {
      crossConverter.isReady.should.equal(true)
    })

    it('should convert 0 to 32 and 32 to 0', () => {
      crossConverter.convert(0, '0', '32').should.equal(32)
      crossConverter.convert(0, '32', '0').should.equal(-32)
    })
  })

  describe('async', () => {
    it('should instantiate', () => {
      crossConverter = new CrossConverter(converters, { isAsync: true })
    })

    it('should be NOT be ready', () => {
      crossConverter.isReady.should.equal(false)
    })

    it('should wait for promise', () => {
      return crossConverter.promise
    })

    it('should be ready', () => {
      crossConverter.isReady.should.equal(true)
    })

    it('should convert 0 to 32 and 32 to 0', () => {
      crossConverter.convert(0, '0', '32').should.equal(32)
      crossConverter.convert(0, '32', '0').should.equal(-32)
    })
  })

})
