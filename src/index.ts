import config from './config'
import logger from './logger'
import TweetBot from './tweet_bot'
import MessageBot from './message_bot'
import { Token } from './token'

async function main() {
  const tokens = await Token.getAll()

  const tweetBot = new TweetBot(tokens)
  tweetBot.start()

  const messageBot = new MessageBot(tokens)
  messageBot.start()
}

main().catch(err => {
  logger.error(err)
})
