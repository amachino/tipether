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
const Twit = require("twit");
const config_1 = require("./config");
const i18n_1 = require("./i18n");
const api = new Twit({
    consumer_key: config_1.default.TWITTER_CONSUMER_KEY,
    consumer_secret: config_1.default.TWITTER_CONSUMER_SECRET,
    access_token: config_1.default.TWITTER_ACCESS_TOKEN,
    access_token_secret: config_1.default.TWITTER_ACCESS_TOKEN_SECRET
});
class Twitter {
    static getTweetStream(obj) {
        return api.stream('statuses/filter', { track: obj.track });
    }
    static getUserStream() {
        return api.stream('user');
    }
    static getUser(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.get('users/lookup', { screen_name: obj.screenName });
            const data = result.data;
            if (data && data.length > 0) {
                return data[0];
            }
            else {
                return null;
            }
        });
    }
    static postTweet(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.post('statuses/update', {
                status: i18n_1.default({ phrase: obj.phrase, locale: obj.locale }, obj.data)
            });
            return result.data;
        });
    }
    static postMentionTweet(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.post('statuses/update', {
                status: `@${obj.username} \n` + i18n_1.default({ phrase: obj.phrase, locale: obj.locale }, obj.data)
            });
            return result.data;
        });
    }
    static postReplyTweet(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.post('statuses/update', {
                status: `@${obj.username} ` + i18n_1.default({ phrase: obj.phrase, locale: obj.locale }, obj.data),
                in_reply_to_status_id: obj.tweetId
            });
            return result.data;
        });
    }
    static postTweetWithMedia(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                api.postMediaChunked({ file_path: obj.mediaPath }, (err, data, response) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        reject(err);
                    }
                    const result = yield api.post('statuses/update', {
                        media_ids: [data.media_id_string],
                        status: i18n_1.default({ phrase: obj.phrase, locale: obj.locale }, obj.data)
                    });
                    resolve(result.data);
                }));
            });
        });
    }
    static postReplyTweetWithMedia(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                api.postMediaChunked({ file_path: obj.mediaPath }, (err, data, response) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        reject(err);
                    }
                    const result = yield api.post('statuses/update', {
                        in_reply_to_status_id: obj.tweetId,
                        media_ids: [data.media_id_string],
                        status: `@${obj.username} ` + i18n_1.default({ phrase: obj.phrase, locale: obj.locale }, obj.data)
                    });
                    resolve(result.data);
                }));
            });
        });
    }
    static postFavorite(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.post('favorites/create', { id: obj.id });
            return result.data;
        });
    }
    static postMessage(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield api.post('direct_messages/events/new', {
                event: {
                    type: 'message_create',
                    message_create: {
                        target: { recipient_id: obj.recipientId },
                        message_data: {
                            text: i18n_1.default({ phrase: obj.phrase, locale: obj.locale }, obj.data)
                        }
                    }
                }
            });
            return result.data;
        });
    }
}
exports.Twitter = Twitter;
//# sourceMappingURL=twitter.js.map