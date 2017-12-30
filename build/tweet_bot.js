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
class TweetBot {
    constructor(tokens) {
        this.id = config_1.default.TWITTER_ID;
        this.screenName = config_1.default.TWITTER_SCREEN_NAME;
        this.tokens = tokens;
        this.sources = this.loadTwitterSources('../sources');
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = twitter_1.Twitter.getTweetStream({ track: this.screenName });
                stream.on('tweet', tweet => {
                    this.handleTweet(tweet);
                });
                stream.on('error', error => {
                    logger_1.default.error(error);
                });
                logger_1.default.info('TweetBot started');
            }
            catch (e) {
                logger_1.default.error(e);
            }
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
            logger_1.default.info('invalid source:', tweet.source);
            return;
        }
        const prefix = `@${this.screenName} `;
        const parser = new parser_1.Parser({ prefix });
        const commands = parser.parseTweet(tweet);
        if (commands.length === 0) {
            logger_1.default.info('tweet command not found:', tweet.text);
            return;
        }
        const command = commands[0];
        logger_1.default.info('parsed tweet command:', command);
        switch (command.type) {
            case parser_1.CommandType.TIP: {
                return this.handleTip({ tweet, command }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.WITHDRAW: {
                return this.handleWithdraw({ tweet, command }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.DEPOSIT: {
                return this.handleDeposit({ tweet }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.BALANCE: {
                return this.handleBalance({ tweet }).catch(err => logger_1.default.error(err));
            }
            case parser_1.CommandType.HELP: {
                return this.handleHelp({ tweet }).catch(err => logger_1.default.error(err));
            }
            default: {
                return;
            }
        }
    }
    handleTip(obj) {
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
            return this.handleTipEther({ tweet, sender, receiver, amount, symbol });
        });
    }
    handleWithdraw(obj) {
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
            return this.handleWithdrawEther({ tweet, sender, address, amount, symbol });
        });
    }
    handleDeposit(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet;
            const user = tweet.user;
            const result = yield api_1.default.getAddress({ id: user.id_str });
            const address = result.address;
            return twitter_1.Twitter.postReplyTweet({
                tweetId: tweet.id_str,
                username: user.screen_name,
                locale: user.lang,
                phrase: 'Show Address',
                data: {
                    sender: user.screen_name,
                    address: address
                }
            });
        });
    }
    handleBalance(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet;
            const user = tweet.user;
            const result = yield api_1.default.getBalance({ id: user.id_str });
            const balance = result.balance;
            return twitter_1.Twitter.postReplyTweet({
                tweetId: tweet.id_str,
                username: user.screen_name,
                locale: user.lang,
                phrase: 'Show Balance',
                data: {
                    sender: user.screen_name,
                    balance: balance,
                    symbol: this.tokens.ETH.symbol
                }
            });
        });
    }
    handleHelp(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet;
            const user = tweet.user;
            return twitter_1.Twitter.postReplyTweet({
                tweetId: tweet.id_str,
                username: user.screen_name,
                locale: user.lang,
                phrase: 'Show Tweet Help',
                data: {
                    sender: user.screen_name,
                    botName: this.screenName
                }
            });
        });
    }
    handleTipEther(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, sender = obj.sender, receiver = obj.receiver, amount = obj.amount, symbol = obj.symbol;
            if (amount <= 0 || amount > this.tokens.ETH.maxTipAmount) {
                yield twitter_1.Twitter.postReplyTweet({
                    tweetId: tweet.id_str,
                    username: sender.screen_name,
                    locale: sender.lang,
                    phrase: 'Tip Limit Error',
                    data: {
                        sender: sender.screen_name,
                        limit: this.tokens.ETH.maxTipAmount,
                        symbol: this.tokens.ETH.symbol
                    }
                });
                throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxTipAmount}"`);
            }
            if (symbol.toUpperCase() !== this.tokens.ETH.symbol) {
                throw new Error(`Invalid symbol: should be "ETH"`);
            }
            const receipt = yield receipt_1.default.get(tweet.id_str);
            if (receipt !== null) {
                throw new Error('The tweet has been processed already');
            }
            const result = yield api_1.default.tipEther({
                senderId: sender.id_str,
                receiverId: receiver.id_str,
                amount: amount
            }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                yield twitter_1.Twitter.postReplyTweet({
                    tweetId: tweet.id_str,
                    username: sender.screen_name,
                    locale: sender.lang,
                    phrase: 'Tip Transaction Error',
                    data: {
                        sender: sender.screen_name,
                        amount: amount,
                        symbol: this.tokens.ETH.symbol
                    }
                });
                throw err;
            }));
            yield receipt_1.default.createTipReceipt(tweet.id_str, {
                tweetId: tweet.id_str,
                senderId: sender.id_str,
                receiverId: receiver.id_str,
                amount: amount,
                symbol: this.tokens.ETH.symbol,
                txId: result.txId
            });
            yield twitter_1.Twitter.postFavorite({ id: tweet.id_str });
            // Tip to tipether
            if (receiver.id_str === this.id) {
                return twitter_1.Twitter.postReplyTweet({
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
                });
            }
            return twitter_1.Twitter.postReplyTweet({
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
            });
        });
    }
    handleWithdrawEther(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, sender = obj.sender, address = obj.address, amount = obj.amount, symbol = obj.symbol;
            if (amount <= 0 || amount > this.tokens.ETH.maxWithdrawAmount) {
                yield twitter_1.Twitter.postReplyTweet({
                    tweetId: tweet.id_str,
                    username: sender.screen_name,
                    locale: sender.lang,
                    phrase: 'Withdraw Limit Error',
                    data: {
                        sender: sender.screen_name,
                        limit: this.tokens.ETH.maxWithdrawAmount,
                        symbol: this.tokens.ETH.symbol
                    }
                });
                throw new Error(`Invalid amount: should be "0 < amount <= ${this.tokens.ETH.maxWithdrawAmount}"`);
            }
            if (symbol.toUpperCase() !== this.tokens.ETH.symbol) {
                throw new Error(`Invalid symbol: should be "ETH"`);
            }
            const receipt = yield receipt_1.default.get(tweet.id_str);
            if (receipt !== null) {
                throw new Error('The tweet has been processed already');
            }
            const result = yield api_1.default.withdrawEther({
                senderId: sender.id_str,
                address: address,
                amount: amount
            }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                yield twitter_1.Twitter.postReplyTweet({
                    tweetId: tweet.id_str,
                    username: sender.screen_name,
                    locale: sender.lang,
                    phrase: 'Withdraw Transaction Error',
                    data: {
                        sender: sender.screen_name,
                        amount: amount,
                        symbol: this.tokens.ETH.symbol
                    }
                });
                throw err;
            }));
            yield receipt_1.default.createWithdrawReceipt(tweet.id_str, {
                tweetId: tweet.id_str,
                senderId: sender.id_str,
                receiverAddress: address,
                amount: amount,
                symbol: this.tokens.ETH.symbol,
                txId: result.txId
            });
            yield twitter_1.Twitter.postFavorite({ id: tweet.id_str });
            return twitter_1.Twitter.postReplyTweet({
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
            });
        });
    }
}
exports.default = TweetBot;
//# sourceMappingURL=tweet_bot.js.map