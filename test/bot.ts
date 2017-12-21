import * as assert from 'assert'
import config from '../src/config'
import Bot from '../src/bot'
import { Token, TokenData, TokenMap } from '../src/token'

describe('Bot', async () => {

  let tokens: TokenMap
  let bot: Bot

  before(async () => {
    tokens = await Token.getAll()
    bot = new Bot(tokens)
  })

  it('verifies instance variables after construction', async () => {
    assert.equal(bot.id, config.TWITTER_ID)
    assert.equal(bot.screenName, config.TWITTER_SCREEN_NAME)
    assert(Object.keys(bot.tokens).length > 0)
  })

})
