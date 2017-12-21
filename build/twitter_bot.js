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
const Twitter = require("twitter");
const config_1 = require("./config");
const logger_1 = require("./logger");
const api_1 = require("./api");
const i18n_1 = require("./i18n");
const receipt_1 = require("./receipt");
const ETH = {
    symbol: 'ETH',
    maxTipAmount: 0.01,
    maxDepositAmount: 1.0
};
const Command = {
    TIP: 'tip',
    CANCEL: 'cancel'
};
class TwitterBot {
    constructor() {
        this.id = config_1.default.TWITTER_ID;
        this.screenName = config_1.default.TWITTER_SCREEN_NAME;
        this.twitter = new Twitter({
            consumer_key: config_1.default.TWITTER_CONSUMER_KEY,
            consumer_secret: config_1.default.TWITTER_CONSUMER_SECRET,
            access_token_key: config_1.default.TWITTER_ACCESS_TOKEN_KEY,
            access_token_secret: config_1.default.TWITTER_ACCESS_TOKEN_SECRET
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            const result1 = yield api_1.default.sendEther({
                senderId: 'Sender',
                receiverId: 'Receiver',
                amount: 0.01
            });
            logger_1.default.debug(result1);
            const result2 = yield api_1.default.getAddress({
                id: 'Sender'
            });
            logger_1.default.debug(result2);
            const result3 = yield api_1.default.withdrowEther({
                id: 'Receiver',
                address: '0xf222067fa11c63ba074cc71a68ddf765ea3bb6dc',
                amount: 0.01
            });
            logger_1.default.debug(result3);
        });
    }
    start() {
        this.twitter.stream('statuses/filter', { track: `@${this.screenName}` }, stream => {
            stream.on('data', data => {
                this.handleTweet(data);
            });
            stream.on('error', error => {
                logger_1.default.error(error);
            });
        });
        logger_1.default.info('app started');
    }
    handleTweet(tweet) {
        const text = tweet.text;
        if (tweet.user.id_str === this.id) {
            // ignore self tweet
            return;
        }
        // TODO: filter tweet.source by whitelist or blacklist
        // TODO: ensure the tweet is intended one (not RT, etc.)
        const { command, params } = this.parseCommand(text);
        if (!command) {
            logger_1.default.debug('no command found');
            return;
        }
        logger_1.default.debug('parsed command', command, params);
        switch (command) {
            case Command.TIP: {
                this.handleTipCommand({ tweet, params }).catch(err => { logger_1.default.error(err); });
                break;
            }
            case Command.CANCEL: {
                this.handleCancelCommand({ tweet }).catch(err => { logger_1.default.error(err); });
                break;
            }
        }
    }
    parseCommand(text) {
        const RE = {
            start: '(?:^| |\\n)',
            botName: `@${this.screenName}`,
            space: ' +',
            command: '([a-zA-Z]+)',
            target: '@([0-9a-zA-Z_]{1,15})',
            amount: '((?:[1-9]\\d*|0)(?:\\.\\d+)?)',
            optionalSpace: ' *',
            symbol: '([a-zA-Z]{3})',
            end: '(?:$|\\n| )',
        };
        const cmdExp = new RegExp(RE.start +
            RE.botName +
            RE.space +
            RE.command +
            '(?:' +
            RE.space +
            RE.target +
            RE.space +
            RE.amount +
            RE.optionalSpace +
            RE.symbol +
            ')?' +
            RE.end);
        logger_1.default.debug(cmdExp);
        const result = text.match(cmdExp);
        if (!result) {
            return null;
        }
        const fullMatch = result[0];
        const command = result[1];
        const target = result[2];
        const amount = result[3];
        const symbol = result[4];
        logger_1.default.debug(fullMatch);
        if (target && amount && symbol) {
            return {
                command,
                params: { target, amount, symbol }
            };
        }
        else {
            return {
                command
            };
        }
    }
    handleTipCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, params = obj.params;
            const sender = tweet.user;
            const amount = Number(params.amount);
            if (isNaN(amount)) {
                throw new Error('amount is NaN');
            }
            const users = yield this.twitter.get('users/lookup', { screen_name: params.target });
            const receiver = users[0];
            const symbol = params.symbol;
            if (symbol.toUpperCase() !== ETH.symbol) {
                throw new Error('invalid symbol');
            }
            yield this.handleTipETHCommand({ tweet, sender, receiver, amount });
        });
    }
    handleTipETHCommand(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweet = obj.tweet, sender = obj.sender, receiver = obj.receiver, amount = obj.amount;
            if (amount <= 0 || amount > ETH.maxTipAmount) {
                throw new Error(`Invalid amount: should be "0 < amount <= ${ETH.maxTipAmount}"`);
            }
            const receiptTweet = yield this.postTweet({
                text: i18n_1.default.__('Tip Received', {
                    sender: sender.screen_name,
                    receiver: receiver.screen_name,
                    amount: amount,
                    symbol: ETH.symbol
                }),
                replyTo: tweet.id_str
            });
            const receiptId = receiptTweet.id_str;
            yield receipt_1.Receipt.create(receiptId, {
                status: receipt_1.Status.PENDING,
                tweetId: String(tweet.id),
                senderId: String(sender.id),
                receiverId: String(receiver.id),
                amount: amount
            });
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                const receipt = yield receipt_1.Receipt.get(receiptId);
                if (receipt) {
                    if (receipt.status === receipt_1.Status.PENDING) {
                        const result = yield api_1.default.sendEther({
                            senderId: sender.id_str,
                            receiverId: receiver.id_str,
                            amount: amount
                        });
                        yield receipt_1.Receipt.update(receiptId, {
                            status: receipt_1.Status.DONE,
                            txId: result.txId
                        });
                        logger_1.default.info('successfully sent', result.txId);
                    }
                    else if (receipt.status === receipt_1.Status.CANCELED) {
                        logger_1.default.info('canceled');
                    }
                    else {
                        throw new Error('invalid receipt status');
                    }
                }
                else {
                    throw new Error('no receipt found');
                }
            }), config_1.default.CANCEL_TIMEOUT);
        });
    }
    handleCancelCommand({ tweet }) {
        return __awaiter(this, void 0, void 0, function* () {
            const receiptId = tweet.in_reply_to_status_id_str;
            const receipt = yield receipt_1.Receipt.get(receiptId);
            if (receipt) {
                if (receipt.status === receipt_1.Status.PENDING) {
                    yield receipt_1.Receipt.update(receiptId, {
                        status: receipt_1.Status.CANCELED
                    });
                    yield this.postTweet({
                        text: i18n_1.default.__('Tip Canceled', {
                            sender: tweet.user.screen_name
                        }),
                        replyTo: tweet.id_str
                    });
                    logger_1.default.info('successfully canceled');
                }
            }
            else {
                throw new Error('no receipt found');
            }
        });
    }
    postTweet({ text, replyTo }) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.twitter.post('statuses/update', {
                status: text,
                in_reply_to_status_id: replyTo
            });
            return result;
        });
    }
}
exports.default = TwitterBot;
//# sourceMappingURL=twitter_bot.js.map