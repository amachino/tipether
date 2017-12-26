"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const config_1 = require("./config");
const logger_1 = require("./logger");
const api_1 = require("./api");
const receipt_1 = require("./receipt");
const twitter_1 = require("./twitter");
const parser_1 = require("./parser");
const util_1 = require("./util");
class Bot {
    constructor(tokens) {
        this.id = config_1.default.TWITTER_ID;
        this.screenName = config_1.default.TWITTER_SCREEN_NAME;
        this.tokens = tokens;
        this.sources = this.loadTwitterSources('../sources');
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield twitter_1.Twitter.trackTweet(this.screenName);
            stream.on('data', data => {
                try {
                    this.handleTweet(data);
                }
                catch (e) {
                    logger_1.default.error(e);
                }
            });
            stream.on('error', error => {
                logger_1.default.error(error);
            });
            logger_1.default.info('app started');
        });
    }
    loadTwitterSources(sourcesPath) {
        const sources = fs.readFileSync(path.join(__dirname, sourcesPath), { encoding: 'utf8' }).trim().split('\n');
        return sources;
    }
    handleTweet(tweet) {
        if (tweet.user.id_str === this.id) {
            logger_1.default.debug('ignored self tweet');
            return;
        }
        if (tweet.retweeted_status !== undefined) {
            logger_1.default.debug('ignored retweet');
            return;
        }
        if (this.sources.indexOf(tweet.source) === -1) {
            logger_1.default.info('invalid source: ', tweet.source);
            return;
        }
        let textToParse = tweet.text;
        // Reply Tweet
        if (tweet.display_text_range !== undefined && typeof tweet.display_text_range[0] === 'number') {
            logger_1.default.debug('display_text_range: ', tweet.display_text_range);
            textToParse = textToParse.slice(tweet.display_text_range[0]);
        }
        const parser = new parser_1.Parser({ botName: this.screenName });
        const commands = parser.parse(textToParse);
        if (commands.length === 0) {
            logger_1.default.info('command not found: ', textToParse);
            return;
        }
        // TODO: accept multipule commands in one tweet
        const command = commands[0];
        logger_1.default.info('parsed command:', command);
        switch (command.type) {
            case parser_1.CommandType.TIP: {
                return this.handleTipCommand({ tweet, command }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.WITHDRAW: {
                return this.handleWithdrawCommand({ tweet, command }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.DEPOSIT: {
                return this.handleDepositCommand({ tweet }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.BALANCE: {
                return this.handleBalanceCommand({ tweet }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.HELP: {
                return this.handleHelpCommand({ tweet }).catch(err => logger_1.default.error(err));
            }
            default: {
                return;
            }
        }
    }
    handleTipCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, command = obj.command;
            const sender = tweet.user;
            const type = command.type;
            if (type !== parser_1.CommandType.TIP) {
                throw new Error('invalid command type');
            }
            let amount = command.amount;
            if (typeof amount !== 'number') {
                amount = this.tokens.ETH.defaultTipAmount;
            }
            let symbol = command.symbol;
            if (typeof symbol !== 'string') {
                symbol = this.tokens.ETH.symbol;
            }
            const receiver = yield twitter_1.Twitter.getUser({ screenName: command.username });
            if (!receiver) {
                throw new Error('no such user');
            }
            return this.handleTipETHCommand({ tweet, sender, receiver, amount, symbol });
        });
    }
    handleWithdrawCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, command = obj.command;
            const sender = tweet.user;
            const type = command.type, address = command.address, amount = command.amount, symbol = command.symbol;
            if (type !== parser_1.CommandType.WITHDRAW) {
                throw new Error('invalid command type');
            }
            if (!/0x[0-9a-fA-F]{40}/.test(address)) {
                throw new Error('invalid address');
            }
            if (typeof amount !== 'number' || typeof symbol !== 'string') {
                throw new Error('invalid amount');
            }
            return this.handleWithdrawETHCommand({ tweet, sender, address, amount, symbol });
        });
    }
    handleTipETHCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, sender = obj.sender, receiver = obj.receiver, amount = obj.amount, symbol = obj.symbol;
            const amountInEth = util_1.default.normalizeToEth(symbol, amount);
            if (amount <= 0 || amountInEth > this.tokens.ETH.maxWithdrawAmount) {
                yield twitter_1.Twitter.postTweet({
                    locale: sender.lang,
                    phrase: 'Tip Limit Error',
                    data: {
                        sender: sender.screen_name,
                        limit: this.tokens.ETH.maxTipAmount,
                        symbol: this.tokens.ETH.symbol
                    },
                    replyTo: tweet.id_str
                });
                throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxTipAmount}"`);
            }
            const receipt = yield receipt_1.default.get(tweet.id_str);
            if (receipt !== null) {
                throw new Error('The tweet has been processed already');
            }
            const result = yield api_1.default.tipEther({
                senderId: sender.id_str,
                receiverId: receiver.id_str,
                amount: amountInEth
            }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                yield twitter_1.Twitter.postTweet({
                    locale: sender.lang,
                    phrase: 'Tip Transaction Error',
                    data: {
                        sender: sender.screen_name,
                        amount: amount,
                        symbol: symbol
                    },
                    replyTo: tweet.id_str
                });
                throw err;
            }));
            yield receipt_1.default.createTipReceipt(tweet.id_str, {
                tweetId: tweet.id_str,
                senderId: sender.id_str,
                receiverId: receiver.id_str,
                amount: amountInEth,
                symbol: this.tokens.ETH.symbol,
                txId: result.txId
            });
            yield twitter_1.Twitter.postFavorite({ id: tweet.id_str });
            return twitter_1.Twitter.postTweet({
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
            });
        });
    }
    handleWithdrawETHCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, sender = obj.sender, address = obj.address, amount = obj.amount, symbol = obj.symbol;
            const amountInEth = util_1.default.normalizeToEth(symbol, amount);
            if (amount <= 0 || amountInEth > this.tokens.ETH.maxWithdrawAmount) {
                yield twitter_1.Twitter.postTweet({
                    locale: sender.lang,
                    phrase: 'Withdraw Limit Error',
                    data: {
                        sender: sender.screen_name,
                        limit: this.tokens.ETH.maxWithdrawAmount,
                        symbol: this.tokens.ETH.symbol
                    },
                    replyTo: tweet.id_str
                });
                throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxWithdrawAmount}"`);
            }
            const receipt = yield receipt_1.default.get(tweet.id_str);
            if (receipt !== null) {
                throw new Error('The tweet has been processed already');
            }
            const result = yield api_1.default.withdrawEther({
                senderId: sender.id_str,
                address: address,
                amount: amountInEth
            }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                yield twitter_1.Twitter.postTweet({
                    locale: sender.lang,
                    phrase: 'Withdraw Transaction Error',
                    data: {
                        sender: sender.screen_name,
                        amount: amount,
                        symbol: symbol
                    },
                    replyTo: tweet.id_str
                });
                throw err;
            }));
            yield receipt_1.default.createWithdrawReceipt(tweet.id_str, {
                tweetId: tweet.id_str,
                senderId: sender.id_str,
                receiverAddress: address,
                amount: amountInEth,
                symbol: this.tokens.ETH.symbol,
                txId: result.txId
            });
            yield twitter_1.Twitter.postFavorite({ id: tweet.id_str });
            return twitter_1.Twitter.postTweet({
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
            });
        });
    }
    handleDepositCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet;
            const user = tweet.user;
            const result = yield api_1.default.getAddress({ id: user.id_str });
            const address = result.address;
            return twitter_1.Twitter.postTweet({
                locale: user.lang,
                phrase: 'Show Address',
                data: {
                    sender: user.screen_name,
                    address: address
                },
                replyTo: tweet.id_str
            });
        });
    }
    handleBalanceCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet;
            const user = tweet.user;
            const result = yield api_1.default.getBalance({ id: user.id_str });
            const balance = result.balance;
            return twitter_1.Twitter.postTweet({
                locale: user.lang,
                phrase: 'Show Balance',
                data: {
                    sender: user.screen_name,
                    balance: balance,
                    symbol: this.tokens.ETH.symbol
                },
                replyTo: tweet.id_str
            });
        });
    }
    handleHelpCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet;
            const user = tweet.user;
            return twitter_1.Twitter.postTweet({
                locale: user.lang,
                phrase: 'Show Help',
                data: {
                    sender: user.screen_name,
                    botName: this.screenName
                },
                replyTo: tweet.id_str
            });
        });
    }
}
exports.default = Bot;
//# sourceMappingURL=bot.js.map