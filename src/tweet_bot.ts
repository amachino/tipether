import * as fs from 'fs'
import * as path from 'path'
import utils from './utils'
import config from './config'
import logger from './logger'
import API from './api'
import Receipt from './receipt'
import { Twitter, Tweet, User } from './twitter'
import { Parser, Command, CommandType } from './parser'
import { TokenData, TokenMap } from './token'

export default class TweetBot {

  public readonly tokens: TokenMap
  public readonly sources: string[]
  public readonly id: string = config.TWITTER_ID
  public readonly screenName: string = config.TWITTER_SCREEN_NAME

  constructor(tokens: TokenMap) {
    this.tokens = tokens
    this.sources = this.loadTwitterSources('../sources')
  }

  public async start() {
    try {
      const stream = Twitter.getTweetStream({ track: this.screenName })
      stream.on('tweet', tweet => {
        this.handleTweet(tweet)
      })
      stream.on('error', error => {
        logger.error(error)
      })
      logger.info('TweetBot started')
    } catch (e) {
      logger.error(e)
    }
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
      logger.info('invalid source:', tweet.source)
      return
    }

    const prefix = `@${this.screenName} `
    const parser = new Parser({ prefix })
    const commands = parser.parseTweet(tweet)
    if (commands.length === 0) {
      logger.info('tweet command not found:', tweet.text)
      return
    }

    const command = commands[0]

    logger.info('parsed tweet command:', command)

    switch (command.type) {
      case CommandType.TIP: {
        return this.handleTip({ tweet, command }).catch(err => logger.error(err))
      }
      case CommandType.OTOSHIDAMA: {
        return this.handleOtoshidama({ tweet, command }).catch(err => logger.error(err))
      }
      case CommandType.WITHDRAW: {
        return this.handleWithdraw({ tweet, command }).catch(err => logger.error(err))
      }
      case CommandType.DEPOSIT: {
        return this.handleDeposit({ tweet }).catch(err => logger.error(err))
      }
      case CommandType.BALANCE: {
        return this.handleBalance({ tweet }).catch(err => logger.error(err))
      }
      case CommandType.HELP: {
        return this.handleHelp({ tweet }).catch(err => logger.error(err))
      }
      default: {
        return
      }
    }
  }

  private async handleTip(obj: { tweet: Tweet, command: Command }): Promise<any> {
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

    return this.handleTipEther({ tweet, sender, receiver, amount, symbol })
  }

  private async handleOtoshidama(obj: { tweet: Tweet, command: Command }): Promise<any> {
    const tweet = obj.tweet, command = obj.command
    const sender: User = tweet.user

    const type = command.type
    if (type !== CommandType.OTOSHIDAMA) {
      throw new Error('invalid command type')
    }

    let amount = command.amount
    if (typeof amount !== 'number') {
      amount = 0.01
    }

    let symbol = command.symbol
    if (typeof symbol !== 'string') {
      symbol = this.tokens.ETH.symbol
    }

    const receiver = await Twitter.getUser({ screenName: command.username })
    if (!receiver) {
      throw new Error('no such user')
    }

    if (amount <= 0 || amount > this.tokens.ETH.maxTipAmount) {
      await Twitter.postReplyTweet({
        tweetId: tweet.id_str,
        username: sender.screen_name,
        locale: sender.lang,
        phrase: 'OTOSHIDAMA Limit Error',
        data: {
          sender: sender.screen_name,
          limit: this.tokens.ETH.maxTipAmount,
          symbol: this.tokens.ETH.symbol
        }
      })
      throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxTipAmount}"`)
    }

    if (symbol.toUpperCase() !== this.tokens.ETH.symbol) {
      throw new Error(`Invalid symbol: should be "ETH"`)
    }

    const receipt = await Receipt.get(tweet.id_str)
    if (receipt !== null) {
      throw new Error('The tweet has been processed already')
    }

    const result = await API.tipEther({
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amount
    }).catch(async err => {
      await Twitter.postReplyTweet({
        tweetId: tweet.id_str,
        username: sender.screen_name,
        locale: sender.lang,
        phrase: 'Tip Transaction Error',
        data: {
          sender: sender.screen_name,
          amount: amount,
          symbol: this.tokens.ETH.symbol
        }
      })
      throw err
    })

    await Receipt.createTipReceipt(tweet.id_str, {
      tweetId: tweet.id_str,
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amount,
      symbol: this.tokens.ETH.symbol,
      txId: result.txId
    })

    await Twitter.postFavorite({ id: tweet.id_str })

    // Tip to tipether
    if (receiver.id_str === this.id) {
      return Twitter.postReplyTweet({
        tweetId: tweet.id_str,
        username: sender.screen_name,
        locale: sender.lang,
        phrase: 'Thanks for OTOSHIDAMA',
        data: {
          sender: sender.screen_name,
          receiver: receiver.screen_name,
          amount: amount,
          symbol: this.tokens.ETH.symbol,
          txId: result.txId
        }
      })
    }

    return Twitter.postReplyTweet({
      tweetId: tweet.id_str,
      username: sender.screen_name,
      locale: receiver.lang,
      phrase: 'OTOSHIDAMA Tweet',
      data: {
        sender: sender.screen_name,
        receiver: receiver.screen_name,
        amount: amount,
        symbol: this.tokens.ETH.symbol
      }
    })
  }

  private async handleWithdraw(obj: { tweet: Tweet, command: Command }): Promise<any> {
    const tweet = obj.tweet, command = obj.command
    const sender: User = tweet.user
    const type = command.type, address = command.address, amount = command.amount, symbol = command.symbol

    if (type !== CommandType.WITHDRAW) {
      throw new Error('invalid command type')
    }

    if (!utils.validateAddress(address)) {
      throw new Error('invalid address')
    }

    if (typeof amount !== 'number' || typeof symbol !== 'string') {
      throw new Error('invalid amount')
    }

    return this.handleWithdrawEther({ tweet, sender, address, amount, symbol })
  }

  private async handleDeposit(obj: { tweet: Tweet }): Promise<any> {
    const tweet = obj.tweet
    const user: User = tweet.user

    const result = await API.getAddress({ id: user.id_str })
    const address = result.address

    return Twitter.postReplyTweet({
      tweetId: tweet.id_str,
      username: user.screen_name,
      locale: user.lang,
      phrase: 'Show Address',
      data: {
        sender: user.screen_name,
        address: address
      }
    })
  }

  private async handleBalance(obj: { tweet: Tweet }): Promise<any> {
    const tweet = obj.tweet
    const user: User = tweet.user

    const result = await API.getBalance({ id: user.id_str })
    const balance = result.balance

    return Twitter.postReplyTweet({
      tweetId: tweet.id_str,
      username: user.screen_name,
      locale: user.lang,
      phrase: 'Show Balance',
      data: {
        sender: user.screen_name,
        balance: balance,
        symbol: this.tokens.ETH.symbol
      }
    })
  }

  private async handleHelp(obj: { tweet: Tweet }): Promise<any> {
    const tweet = obj.tweet
    const user: User = tweet.user

    return Twitter.postReplyTweet({
      tweetId: tweet.id_str,
      username: user.screen_name,
      locale: user.lang,
      phrase: 'Show Tweet Help',
      data: {
        sender: user.screen_name,
        botName: this.screenName
      }
    })
  }

  private async handleTipEther(obj: { tweet: Tweet, sender: User, receiver: User, amount: number, symbol: string }): Promise<any> {
    const tweet = obj.tweet, sender = obj.sender, receiver = obj.receiver, amount = obj.amount, symbol = obj.symbol
    if (amount <= 0 || amount > this.tokens.ETH.maxTipAmount) {
      await Twitter.postReplyTweet({
        tweetId: tweet.id_str,
        username: sender.screen_name,
        locale: sender.lang,
        phrase: 'Tip Limit Error',
        data: {
          sender: sender.screen_name,
          limit: this.tokens.ETH.maxTipAmount,
          symbol: this.tokens.ETH.symbol
        }
      })
      throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxTipAmount}"`)
    }

    if (symbol.toUpperCase() !== this.tokens.ETH.symbol) {
      throw new Error(`Invalid symbol: should be "ETH"`)
    }

    const receipt = await Receipt.get(tweet.id_str)
    if (receipt !== null) {
      throw new Error('The tweet has been processed already')
    }

    const result = await API.tipEther({
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amount
    }).catch(async err => {
      if (err.message === 'insufficient funds for gas * price + value') {
        await Twitter.postReplyTweet({
          tweetId: tweet.id_str,
          username: sender.screen_name,
          locale: sender.lang,
          phrase: 'Insufficient Funds for Tip',
          data: {
            sender: sender.screen_name,
            amount: amount,
            symbol: this.tokens.ETH.symbol
          }
        })
      } else if (err.message === 'invalid value') {
        await Twitter.postReplyTweet({
          tweetId: tweet.id_str,
          username: sender.screen_name,
          locale: sender.lang,
          phrase: 'Invalid Value for Tip',
          data: {
            sender: sender.screen_name,
            amount: amount,
            symbol: this.tokens.ETH.symbol
          }
        })
      } else {
        await Twitter.postReplyTweet({
          tweetId: tweet.id_str,
          username: sender.screen_name,
          locale: sender.lang,
          phrase: 'Tip Transaction Error',
          data: {
            sender: sender.screen_name,
            amount: amount,
            symbol: this.tokens.ETH.symbol
          }
        })
      }
      throw err
    })

    await Receipt.createTipReceipt(tweet.id_str, {
      tweetId: tweet.id_str,
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amount,
      symbol: this.tokens.ETH.symbol,
      txId: result.txId
    })

    await Twitter.postFavorite({ id: tweet.id_str })

    // Tip to tipether
    if (receiver.id_str === this.id) {
      return Twitter.postReplyTweet({
        tweetId: tweet.id_str,
        username: sender.screen_name,
        locale: sender.lang,
        phrase: 'Thanks for Tip',
        data: {
          sender: sender.screen_name,
          receiver: receiver.screen_name,
          amount: amount,
          symbol: this.tokens.ETH.symbol,
          txId: result.txId
        }
      })
    }

    return Twitter.postReplyTweet({
      tweetId: tweet.id_str,
      username: sender.screen_name,
      locale: receiver.lang,
      phrase: 'Tip Tweet',
      data: {
        sender: sender.screen_name,
        receiver: receiver.screen_name,
        amount: amount,
        symbol: this.tokens.ETH.symbol
      }
    })
  }

  private async handleWithdrawEther(obj: { tweet: Tweet, sender: User, address: string, amount: number, symbol: string }): Promise<any> {
    const tweet = obj.tweet, sender = obj.sender, address = obj.address, amount = obj.amount, symbol = obj.symbol
    if (amount <= 0 || amount > this.tokens.ETH.maxWithdrawAmount) {
      await Twitter.postReplyTweet({
        tweetId: tweet.id_str,
        username: sender.screen_name,
        locale: sender.lang,
        phrase: 'Withdraw Limit Error',
        data: {
          sender: sender.screen_name,
          limit: this.tokens.ETH.maxWithdrawAmount,
          symbol: this.tokens.ETH.symbol
        }
      })
      throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxWithdrawAmount}"`)
    }

    if (symbol.toUpperCase() !== this.tokens.ETH.symbol) {
      throw new Error(`Invalid symbol: should be "ETH"`)
    }

    const receipt = await Receipt.get(tweet.id_str)
    if (receipt !== null) {
      throw new Error('The tweet has been processed already')
    }

    const result = await API.withdrawEther({
      senderId: sender.id_str,
      address: address,
      amount: amount
    }).catch(async err => {
      await Twitter.postReplyTweet({
        tweetId: tweet.id_str,
        username: sender.screen_name,
        locale: sender.lang,
        phrase: 'Withdraw Transaction Error',
        data: {
          sender: sender.screen_name,
          amount: amount,
          symbol: this.tokens.ETH.symbol
        }
      })
      throw err
    })

    await Receipt.createWithdrawReceipt(tweet.id_str, {
      tweetId: tweet.id_str,
      senderId: sender.id_str,
      receiverAddress: address,
      amount: amount,
      symbol: this.tokens.ETH.symbol,
      txId: result.txId
    })

    await Twitter.postFavorite({ id: tweet.id_str })

    return Twitter.postReplyTweet({
      tweetId: tweet.id_str,
      username: sender.screen_name,
      locale: sender.lang,
      phrase: 'Transaction Sent',
      data: {
        sender: sender.screen_name,
        address: address,
        amount: amount,
        symbol: this.tokens.ETH.symbol,
        txId: result.txId
      }
    })
  }

}
