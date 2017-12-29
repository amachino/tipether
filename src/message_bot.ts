import config from './config'
import logger from './logger'
import API from './api'
import Receipt from './receipt'
import { Twitter, Message, User } from './twitter'
import { Parser, Command, CommandType } from './parser'
import { TokenData, TokenMap } from './token'

export default class MessageBot {

  public readonly tokens: TokenMap
  public readonly id: string = config.TWITTER_ID
  public readonly screenName: string = config.TWITTER_SCREEN_NAME

  constructor(tokens: TokenMap) {
    this.tokens = tokens
  }

  public async start() {
    const stream = Twitter.getUserStream()
    stream.on('direct_message', message => {
      try {
        this.handleMessage(message.direct_message)
      } catch (e) {
        logger.error(e)
      }
    })
    stream.on('error', error => {
      logger.error(error)
    })
    logger.info('MessageBot started')
  }

  private handleMessage(message: Message) {
    if (message.sender_id_str === this.id) {
      logger.debug('ignored self message')
      return
    }

    const prefix = `@${this.screenName} `
    const parser = new Parser({ prefix })
    const commands = parser.parseMessage(message)
    if (commands.length === 0) {
      logger.info('message command not found:', message.text)
      return
    }

    const command = commands[0]

    logger.info('parsed message command:', command)

    switch (command.type) {
      case CommandType.TIP: {
        return this.handleTip({ message, command }).catch(err => logger.error(err))
      }
      case CommandType.WITHDRAW: {
        return this.handleWithdraw({ message, command }).catch(err => logger.error(err))
      }
      case CommandType.DEPOSIT: {
        return this.handleDeposit({ message }).catch(err => logger.error(err))
      }
      case CommandType.BALANCE: {
        return this.handleBalance({ message }).catch(err => logger.error(err))
      }
      case CommandType.HELP: {
        return this.handleHelp({ message }).catch(err => logger.error(err))
      }
      default: {
        return
      }
    }
  }

  private async handleTip(obj: { message: Message, command: Command }): Promise<any> {
    const message = obj.message, command = obj.command
    const sender: User = message.sender

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

    return this.handleTipEther({ message, sender, receiver, amount, symbol })
  }

  private async handleWithdraw(obj: { message: Message, command: Command }): Promise<any> {
    const message = obj.message, command = obj.command
    const sender: User = message.sender
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

    return this.handleWithdrawEther({ message, sender, address, amount, symbol })
  }

  private async handleDeposit(obj: { message: Message }): Promise<any> {
    const message = obj.message
    const user: User = message.sender

    const result = await API.getAddress({ id: user.id_str })
    const address = result.address

    return Twitter.postMessage({
      recipientId: user.id_str,
      locale: user.lang,
      phrase: 'Show Address',
      data: {
        sender: user.screen_name,
        address: address
      }
    })
  }

  private async handleBalance(obj: { message: Message }): Promise<any> {
    const message = obj.message
    const user: User = message.sender

    const result = await API.getBalance({ id: user.id_str })
    const balance = result.balance

    return Twitter.postMessage({
      recipientId: user.id_str,
      locale: user.lang,
      phrase: 'Show Balance',
      data: {
        sender: user.screen_name,
        balance: balance,
        symbol: this.tokens.ETH.symbol
      }
    })
  }

  private async handleHelp(obj: { message: Message }): Promise<any> {
    const message = obj.message
    const user: User = message.sender

    return Twitter.postMessage({
      recipientId: user.id_str,
      locale: user.lang,
      phrase: 'Show Message Help',
      data: {
        sender: user.screen_name,
        botName: this.screenName
      }
    })
  }

  private async handleTipEther(obj: { message: Message, sender: User, receiver: User, amount: number, symbol: string }): Promise<any> {
    const message = obj.message, sender = obj.sender, receiver = obj.receiver, amount = obj.amount, symbol = obj.symbol
    if (amount <= 0 || amount > this.tokens.ETH.maxTipAmount) {
      await Twitter.postMessage({
        recipientId: sender.id_str,
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

    const receipt = await Receipt.get(message.id_str)
    if (receipt !== null) {
      throw new Error('The tweet has been processed already')
    }

    const result = await API.tipEther({
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amount
    }).catch(async err => {
      await Twitter.postMessage({
        recipientId: sender.id_str,
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

    await Receipt.createTipReceipt(message.id_str, {
      messageId: message.id_str,
      senderId: sender.id_str,
      receiverId: receiver.id_str,
      amount: amount,
      symbol: this.tokens.ETH.symbol,
      txId: result.txId
    })

    // Tip to tipether
    if (receiver.id_str === this.id) {
      return Twitter.postMessage({
        recipientId: sender.id_str,
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

    await Twitter.postMessage({
      recipientId: sender.id_str,
      locale: sender.lang,
      phrase: 'Tip Sent',
      data: {
        sender: sender.screen_name,
        receiver: receiver.screen_name,
        amount: amount,
        symbol: this.tokens.ETH.symbol
      }
    })

    return Twitter.postTweet({
      locale: sender.lang,
      phrase: 'Tip Tweet',
      data: {
        sender: sender.screen_name,
        receiver: receiver.screen_name,
        amount: amount,
        symbol: this.tokens.ETH.symbol
      }
    })
  }

  private async handleWithdrawEther(obj: { message: Message, sender: User, address: string, amount: number, symbol: string }): Promise<any> {
    const message = obj.message, sender = obj.sender, address = obj.address, amount = obj.amount, symbol = obj.symbol
    if (amount <= 0 || amount > this.tokens.ETH.maxWithdrawAmount) {
      await Twitter.postMessage({
        recipientId: sender.id_str,
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

    const receipt = await Receipt.get(message.id_str)
    if (receipt !== null) {
      throw new Error('The message has been processed already')
    }

    const result = await API.withdrawEther({
      senderId: sender.id_str,
      address: address,
      amount: amount
    }).catch(async err => {
      await Twitter.postMessage({
        recipientId: sender.id_str,
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

    await Receipt.createWithdrawReceipt(message.id_str, {
      messageId: message.id_str,
      senderId: sender.id_str,
      receiverAddress: address,
      amount: amount,
      symbol: this.tokens.ETH.symbol,
      txId: result.txId
    })

    return Twitter.postMessage({
      recipientId: sender.id_str,
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
