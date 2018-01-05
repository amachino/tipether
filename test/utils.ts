import * as assert from 'assert'
import Utils from '../src/utils'

describe('Utils', () => {

  describe('normalizeToEth', () => {
    context('when args passed in ETH', () => {
      it('does not normalize the args', () => {
        assert.deepEqual(1, Utils.normalizeToEth('ETH', 1))
      })
    })

    context('when args passed in Wei', () => {
      it('normalizes the args', () => {
        assert.deepEqual(0.000000001, Utils.normalizeToEth('Wei', 10000000000))
      })
    })

    context('when args passed in neither ETH nor Wei', () => {
      it('throws an `Error`', () => {
        assert.throws(() => {
          Utils.normalizeToEth('No Such Unit', 10000000000)
        }, 'Invalid symbol: should be either "ETH" or "Wei"')
      })
    })
  })

  describe('validateAddress', () => {
    context('when invalid address passed', () => {
      it('should return false', () => {
        assert.deepEqual(false, Utils.validateAddress('5f8f68a0d1cbc75f6ef764a44619277092c32df0'))
      })
    })

    context('when valid address passed', () => {
      it('should return true', () => {
        assert.deepEqual(true, Utils.validateAddress('0x5F8f68a0d1cbc75f6ef764a44619277092c32df0'))
      })
    })

    context('when valid ENS name passed', () => {
      it('should return true', () => {
        assert.deepEqual(true, Utils.validateAddress('Vitalik-Buterin.eth'))
      })
    })
  })

})
