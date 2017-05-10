const Nobject = require('nobject')
const CrossConverter = require('./')
const chai = require('chai')
const UserArgumentTypeError = require('arguguard/errors/user/ArgumentType')
const NoConverterError = require('./errors/NoConverter')
const NoPathError = require('./errors/NoPath')
const ConversionError = require('./errors/Conversion')

chai.should()


describe('CrossConverter', () => {

  let crossConverter

  it('should instantiate', () => {
    crossConverter = new CrossConverter()
  })

  it('should add converters', () => {
    crossConverter.addConverter('meters', 'centimeters', (meters) => {
      return meters * 100
    })
    crossConverter.addConverter('centimeters', 'meters', (centimeters) => {
      return centimeters / 100
    })
    crossConverter.addConverter('meters', 'kilometers', (meters) => {
      return meters / 1000
    })
    crossConverter.addConverter('kilometers', 'meters', (kilometers) => {
      return kilometers * 1000
    })
    crossConverter.addConverter('decimeters', 'centimeters', (decimeters) => {
      return decimeters * 10
    })
    crossConverter.addConverter('centimeters', 'decimeters', (centmeters) => {
      return centmeters / 10
    })
    crossConverter.addConverter('pounds', 'ounces', (pounds) => {
      return pounds * 16
    })
    crossConverter.addConverter('ounces', 'pounds', (ounces) => {
      return ounces / 16
    })
  })

  describe('arguguard errors', () => {

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

    it('"feet" formFrom should throw NoConverterError', () => {
      (() => {
        crossConverter.convert(1, 'feet', 'meters')
      }).should.throw(NoConverterError)
    })

    it('"feet" formTo should throw NoConverterError', () => {
      (() => {
        crossConverter.convert(1, 'meters', 'feet')
      }).should.throw(NoConverterError)
    })

    it('"pounds" should throw NoConverterError', () => {
      (() => {
        crossConverter.convert(1, 'meters', 'pounds')
      }).should.throw(NoPathError)
    })

    it('should throw NoPathError when converting kilometers to decimeters', () => {
      (() => {
        crossConverter.convert(1, 'kilometers', 'decimeters').should.equal(1000 * 10)
      }).should.throw(NoPathError)
    })

    it('should throw NoConverterError when adding invalid path', () => {
      (() => {
        crossConverter.addPath(['kilometers', 'centimeters', 'decimeters'])
      }).should.throw(NoConverterError)
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

    it('should convert kilometers to decimeters after setting a path', () => {
      crossConverter.addPath(['kilometers', 'meters', 'centimeters', 'decimeters'])
      crossConverter.convert(1, 'kilometers', 'decimeters').should.equal(1000 * 10)
    })
  })

})
