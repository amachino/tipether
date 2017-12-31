import * as nearley from 'nearley'
import * as command from './command'
import logger from './logger'
import { Tweet, Message } from './twitter'

const grammer = nearley.Grammar.fromCompiled(command)

export type Command = {
  type: string
  username?: string
  address?: string
  amount?: number
  symbol?: string
}

export enum CommandType {
  TIP = 'tip',
  WITHDRAW = 'withdraw',
  DEPOSIT = 'deposit',
  BALANCE = 'balance',
  HELP = 'help',
  OTOSHIDAMA = 'otoshidama'
}

export class Parser {

  private prefix: string

  constructor(obj: { prefix: string }) {
    this.prefix = obj.prefix
  }

  public parseTweet(tweet: Tweet): Command[] {
    let text = tweet.text

    // Omit mentions from reply tweet
    if (tweet.display_text_range !== undefined && typeof tweet.display_text_range[0] === 'number') {
      logger.debug('display_text_range:', tweet.display_text_range)
      text = text.slice(tweet.display_text_range[0])
    }

    let parser: nearley.Parser
    const lines = text.split(/\r?\n/)
    const results = []
    lines.forEach(line => {
      if (line.indexOf(this.prefix) !== 0) {
        return
      }
      try {
        const textToParse = line.slice(this.prefix.length)
        parser = new nearley.Parser(grammer)
        parser.feed(textToParse)
        if (parser.results.length > 0) {
          results.push(parser.results[0])
        }
      } catch (e) {
        // logger.error(e)
      }
    })
    return results
  }

  public parseMessage(message: Message): Command[] {
    const text = message.text

    let parser: nearley.Parser
    const lines = text.split(/\r?\n/)
    const results = []
    lines.forEach(line => {
      let textToParse = line
      if (line.indexOf(this.prefix) === 0) {
        textToParse = line.slice(this.prefix.length)
      }
      try {
        parser = new nearley.Parser(grammer)
        parser.feed(textToParse)
        if (parser.results.length > 0) {
          results.push(parser.results[0])
        }
      } catch (e) {
        // logger.error(e)
      }
    })
    return results
  }

}
