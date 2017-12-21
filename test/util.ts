import * as assert from 'assert'
import Util from '../src/util'

describe('Util', () => {

  describe('normalizeToEth', () => {
    context('when args passed in ETH', () => {
      it('does not normalize the args', () => {
        assert.deepEqual(1, Util.normalizeToEth('ETH', 1))
      })
    })

    context('when args passed in Wei', () => {
      it('does not normalize the args', () => {
        assert.deepEqual(0.000000001, Util.normalizeToEth('Wei', 10000000000))
      })
    })

    context('when args passed in neither ETH nor Wei', () => {
      it('does not normalize the args', () => {
        assert.throws(() => {
          Util.normalizeToEth('No Such Unit', 10000000000)
        }, 'Invalid symbol: should be either "ETH" or "Wei"')
      })
    })
  })

})
