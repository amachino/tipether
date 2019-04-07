import logger from './logger'
import TweetBot from './tweet_bot'
import { Token } from './token'

async function main() {
  const tokens = await Token.getAll()

  const tweetBot = new TweetBot(tokens)
  tweetBot.start()
}

main().catch(err => {
  logger.error(err)
})
