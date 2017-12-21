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
const TwitterAPI = require("twitter");
const config_1 = require("./config");
const api = new TwitterAPI({
    consumer_key: config_1.default.TWITTER_CONSUMER_KEY,
    consumer_secret: config_1.default.TWITTER_CONSUMER_SECRET,
    access_token_key: config_1.default.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: config_1.default.TWITTER_ACCESS_TOKEN_SECRET
});
class Twitter {
    static trackTweet(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield api.stream('statuses/filter', { track: keyword });
            return stream;
        });
    }
    static getUser(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.get('users/lookup', { screen_name: obj.screenName });
            if (result && result.length > 0) {
                return result[0];
            }
            else {
                return null;
            }
        });
    }
    static postTweet({ text, replyTo }) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.post('statuses/update', {
                status: text,
                in_reply_to_status_id: replyTo
            });
            return result;
        });
    }
    static postFavorite(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.post('favorites/create', { id: obj.id });
            return result;
        });
    }
}
exports.Twitter = Twitter;
//# sourceMappingURL=twitter.js.map