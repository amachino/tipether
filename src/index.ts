import config from './config'
import logger from './logger'
import Bot from './bot'
import { Token } from './token'

async function main() {
  const tokens = await Token.getAll()
  const bot = new Bot(tokens)
  bot.start()
}

main().catch(err => {
  logger.error(err)
})
