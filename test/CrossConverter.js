const Nobject = require('nobject')
const CrossConverter = require('../')
const chai = require('chai')
const UserArgumentTypeError = require('arguguard/errors/user/ArgumentType')
const NoFormError = require('../errors/NoForm')
const NoPathError = require('../errors/NoPath')
const ConversionError = require('../errors/Conversion')
const _ = require('lodash')

chai.should()

function shuffle(a) {
  var j, x, i;
  for (i = a.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
  return a
}

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

converters.set('number', 'boolean', (number) => {
  if (number === 0) {
    return true
  } else if (number === 1) {
    return false
  } else {
    throw new Error('number must be 0 or 1')
  }
})

describe('CrossConverter', () => {

  let crossConverter

  it('should instantiate', () => {
    crossConverter = new CrossConverter(converters)
  })

  it('should have 8 forms', () => {
    crossConverter.forms.length.should.equal(8)
  })

  describe('errors', () => {

    it('null formFrom should throw UserArgumentTypeError', () => {
      (() => {
        crossConverter.convert(1, 'meters', null)
      }).should.throw(UserArgumentTypeError)
    })

    it('null formTo should throw UserArgumentTypeError', () => {
      (() => {
        crossConverter.convert(1, null, 'meters')
      }).should.throw(UserArgumentTypeError)
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
  shuffle(_.range(10)).forEach((index) => {
    converters.set(index + '', index + 1 + '', (little) => {
      return little + 1
    })
    converters.set(index + 1 + '', index + '', (big) => {
      return big - 1
    })
  })

  let crossConverter

  it('should instantiate', () => {
    crossConverter = new CrossConverter(converters)
  })

  it('should convert 0 to 10 and 10 to 0', () => {
    crossConverter.convert(0, '0', '10').should.equal(10)
    crossConverter.convert(0, '10', '0').should.equal(-10)
  })
})

describe('big combo (32)', () => {

  const converters = new Nobject
  shuffle(_.range(32)).forEach((index) => {
    converters.set(index + '', index + 1 + '', (little) => {
      return little + 1
    })
    converters.set(index + 1 + '', index + '', (big) => {
      return big - 1
    })
  })

  let crossConverter

  it('should instantiate', () => {
    crossConverter = new CrossConverter(converters, {
      formPairsSort: (formPairA, formPairB) => {
        const difA = Math.abs(parseInt(formPairA[0]) - parseInt(formPairA[1]))
        const difB = Math.abs(parseInt(formPairB[0]) - parseInt(formPairB[1]))
        return difB - difA
      }
    })
  })

  it('should convert 0 to 32 and 32 to 0', () => {
    crossConverter.convert(0, '0', '32').should.equal(32)
    crossConverter.convert(0, '32', '0').should.equal(-32)
  })

})
