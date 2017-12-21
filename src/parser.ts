import * as nearley from 'nearley'
import * as command from './command'
import logger from './logger'

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
  HELP = 'help'
}

export class Parser {

  private botName: string

  constructor(obj: { botName: string }) {
    this.botName = '@' + obj.botName
  }

  public parse(text: string): Command[] {
    let parser: nearley.Parser
    const grammer = nearley.Grammar.fromCompiled(command)
    const lines = text.split(/\r?\n/)
    const results = []
    lines.forEach(line => {
      if (line.indexOf(this.botName) !== 0) {
        return
      }
      try {
        const text = line.slice(this.botName.length)
        parser = new nearley.Parser(grammer)
        parser.feed(text)
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
