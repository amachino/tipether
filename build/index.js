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
const logger_1 = require("./logger");
const tweet_bot_1 = require("./tweet_bot");
const message_bot_1 = require("./message_bot");
const token_1 = require("./token");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = yield token_1.Token.getAll();
        const tweetBot = new tweet_bot_1.default(tokens);
        tweetBot.start();
        const messageBot = new message_bot_1.default(tokens);
        messageBot.start();
    });
}
main().catch(err => {
    logger_1.default.error(err);
});
//# sourceMappingURL=index.js.map