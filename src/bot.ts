import * as fs from 'fs'
import * as path from 'path'
import config from './config'
import logger from './logger'
import API from './api'
import Receipt from './receipt'
import { Twitter, Tweet, User } from './twitter'
import { Parser, Command, CommandType } from './parser'
import { TokenData, TokenMap } from './token'
import Util from './util'

export default class Bot {

  public readonly tokens: TokenMap
  public readonly sources: string[]
  public readonly id: string = config.TWITTER_ID
  public readonly screenName: string = config.TWITTER_SCREEN_NAME

  constructor(tokens: TokenMap) {
    this.tokens = tokens
    this.sources = this.loadTwitterSources('../sources')
  }

  public async start() {
    const stream = await Twitter.trackTweet(this.screenName)
    stream.on('data', data => {
      try {
        this.handleTweet(data)
      } catch (e) {
        logger.error(e)
      }
    })
    stream.on('error', error => {
      logger.error(error)
    })
    logger.info('app started')
  }

  private loadTwitterSources(sourcesPath: string): string[] {
    const sources = fs.readFileSync(path.join(__dirname, sourcesPath), { encoding: 'utf8' }).trim().split('\n')
    return sources
  }

  private handleTweet(tweet: Tweet) {
    if (tweet.user.id_str === this.id) {
      logger.debug('ignored self tweet')
      return
    }
    if (tweet.retweeted_status !== undefined) {
      logger.debug('ignored retweet')
      return
    }
    if (this.sources.indexOf(tweet.source) === -1) {
      logger.info('invalid source: ', tweet.source)
      return
    }

    let textToParse = tweet.text

    // Reply Tweet
    if (tweet.display_text_range !== undefined && typeof tweet.display_text_range[0] === 'number') {
      logger.debug('display_text_range: ', tweet.display_text_range)
      textToParse = textToParse.slice(tweet.display_text_range[0])
    }

    const parser = new Parser({ botName: this.screenName })
    const commands = parser.parse(textToParse)
    if (commands.length === 0) {
      logger.info('command not found: ', textToParse)
      return
    }

    // TODO: accept multipule commands in one tweet
    const command = commands[0]

    logger.info('parsed command:', command)

    switch (command.type) {
      case CommandType.TIP: {
        return this.handleTipCommand({ tweet, command }).catch(err => logger.error(err))
      }
      case CommandType.WITHDRAW: {
        return this.handleWithdrawCommand({ tweet, command }).catch(err => logger.error(err))
      }
      case CommandType.DEPOSIT: {
        return this.handleDepositCommand({ tweet }).catch(err => logger.error(err))
      }
      case CommandType.BALANCE: {
        return this.handleBalanceCommand({ tweet }).catch(err => logger.error(err))
      }
      case CommandType.HELP: {
        return this.handleHelpCommand({ tweet }).catch(err => logger.error(err))
      }
      default: {
        return
      }
    }
  }

  private async handleTipCommand(obj: { tweet: Tweet, command: Command }): Promise<any> {
    const tweet = obj.tweet, command = obj.command
    const sender: User = tweet.user

    const type = command.type
    if (type !== CommandType.TIP) {
      throw new Error('invalid command type')
    }

    let amount = command.amount
    if (typeof amount !== 'number') {
      amount = this.tokens.ETH.defaultTipAmount
    }

    let symbol = command.symbol
    if (typeof symbol !== 'string') {
      symbol = this.tokens.ETH.symbol
    }

    const receiver = await Twitter.getUser({ screenName: command.username })
    if (!receiver) {
      throw new Error('no such user')
    }

    return this.handleTipETHCommand({ tweet, sender, receiver, amount, symbol })
  }

  private async handleWithdrawCommand(obj: { tweet: Tweet, command: Command }): Promise<any> {
    const tweet = obj.tweet, command = obj.command
    const sender: User = tweet.user
    const type = command.type, address = command.address, amount = command.amount, symbol = command.symbol

    if (type !== CommandType.WITHDRAW) {
      throw new Error('invalid command type')
    }

    if (!/0x[0-9a-fA-F]{40}/.test(address)) {
      throw new Error('invalid address')
    }

    if (typeof amount !== 'number' || typeof symbol !== 'string') {
      throw new Error('invalid amount')
    }

    return this.handleWithdrawETHCommand({ tweet, sender, address, amount, symbol })
  }

  private async handleTipETHCommand(obj: { tweet: Tweet, sender: User, receiver: User, amount: number, symbol: string }): Promise<any> {
    const tweet = obj.tweet, sender = obj.sender, receiver = obj.receiver, amount = obj.amount, symbol = obj.symbol
    let amountInEth = Util.normalizeToEth(symbol, amount)
    if (amount <= 0 || amountInEth > this.tokens.ETH.maxWithdrawAmount) {
      await Twitter.postTweet({
        locale: sender.lang,
        phrase: 'Tip Limit Error',
        data: {
          sender: sender.screen_name,
          limit: this.tokens.ETH.maxTipAmount,
          symbol: this.tokens.ETH.symbol
        },
        replyTo: tweet.id_str
      })
      throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxTipAmount}"`)
    }

    const receipt = await Receipt.get(tweet.id_str)
    if (receipt !== null) {
      throw new Error('The tweet has been processed already')
    }

    const result = await API.tipEther({
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amountInEth
    }).catch(async err => {
      await Twitter.postTweet({
        locale: sender.lang,
        phrase: 'Tip Transaction Error',
        data: {
          sender: sender.screen_name,
          amount: amount,
          symbol: symbol
        },
        replyTo: tweet.id_str
      })
      throw err
    })

    await Receipt.createTipReceipt(tweet.id_str, {
      tweetId: tweet.id_str,
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amountInEth,
      symbol: this.tokens.ETH.symbol,
      txId: result.txId
    })

    await Twitter.postFavorite({ id: tweet.id_str })

    return Twitter.postTweet({ // this may fail due to tweet limit
      locale: receiver.lang,
      phrase: 'Tip Sent',
      data: {
        sender: sender.screen_name,
        receiver: receiver.screen_name,
        amount: amount,
        symbol: symbol,
        txId: result.txId
      },
      replyTo: tweet.id_str
    })
  }

  private async handleWithdrawETHCommand(obj: { tweet: Tweet, sender: User, address: string, amount: number, symbol: string }): Promise<any> {
    const tweet = obj.tweet, sender = obj.sender, address = obj.address, amount = obj.amount, symbol = obj.symbol
    let amountInEth = Util.normalizeToEth(symbol, amount)
    if (amount <= 0 || amountInEth > this.tokens.ETH.maxWithdrawAmount) {
      await Twitter.postTweet({ // this may fail due to tweet limit
        locale: sender.lang,
        phrase: 'Withdraw Limit Error',
        data: {
          sender: sender.screen_name,
          limit: this.tokens.ETH.maxWithdrawAmount,
          symbol: this.tokens.ETH.symbol
        },
        replyTo: tweet.id_str
      })
      throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxWithdrawAmount}"`)
    }

    const receipt = await Receipt.get(tweet.id_str)
    if (receipt !== null) {
      throw new Error('The tweet has been processed already')
    }

    const result = await API.withdrawEther({
      senderId: sender.id_str,
      address: address,
      amount: amountInEth
    }).catch(async err => {
      await Twitter.postTweet({
        locale: sender.lang,
        phrase: 'Withdraw Transaction Error',
        data: {
          sender: sender.screen_name,
          amount: amount,
          symbol: symbol
        },
        replyTo: tweet.id_str
      })
      throw err
    })

    await Receipt.createWithdrawReceipt(tweet.id_str, {
      tweetId: tweet.id_str,
      senderId: sender.id_str,
      receiverAddress: address,
      amount: amountInEth,
      symbol: this.tokens.ETH.symbol,
      txId: result.txId
    })

    await Twitter.postFavorite({ id: tweet.id_str })

    return Twitter.postTweet({ // this may fail due to tweet limit
      locale: sender.lang,
      phrase: 'Transaction Sent',
      data: {
        sender: sender.screen_name,
        address: address,
        amount: amount,
        symbol: symbol,
        txId: result.txId
      },
      replyTo: tweet.id_str
    })
  }

  private async handleDepositCommand(obj: { tweet: Tweet }): Promise<any> {
    const tweet = obj.tweet
    const user: User = tweet.user

    const result = await API.getAddress({ id: user.id_str })
    const address = result.address

    return Twitter.postTweet({ // this may fail due to tweet limit
      locale: user.lang,
      phrase: 'Show Address',
      data: {
        sender: user.screen_name,
        address: address
      },
      replyTo: tweet.id_str
    })
  }

  private async handleBalanceCommand(obj: { tweet: Tweet }): Promise<any> {
    const tweet = obj.tweet
    const user: User = tweet.user

    const result = await API.getBalance({ id: user.id_str })
    const balance = result.balance

    return Twitter.postTweet({
      locale: user.lang,
      phrase: 'Show Balance',
      data: {
        sender: user.screen_name,
        balance: balance,
        symbol: this.tokens.ETH.symbol
      },
      replyTo: tweet.id_str
    })
  }

  private async handleHelpCommand(obj: { tweet: Tweet }): Promise<any> {
    const tweet = obj.tweet
    const user: User = tweet.user

    return Twitter.postTweet({
      locale: user.lang,
      phrase: 'Show Help',
      data: {
        sender: user.screen_name,
        botName: this.screenName
      },
      replyTo: tweet.id_str
    })
  }

}
