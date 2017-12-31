"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nearley = require("nearley");
const command = require("./command");
const logger_1 = require("./logger");
const grammer = nearley.Grammar.fromCompiled(command);
var CommandType;
(function (CommandType) {
    CommandType["TIP"] = "tip";
    CommandType["WITHDRAW"] = "withdraw";
    CommandType["DEPOSIT"] = "deposit";
    CommandType["BALANCE"] = "balance";
    CommandType["HELP"] = "help";
    CommandType["OTOSHIDAMA"] = "otoshidama";
})(CommandType = exports.CommandType || (exports.CommandType = {}));
class Parser {
    constructor(obj) {
        this.prefix = obj.prefix;
    }
    parseTweet(tweet) {
        let text = tweet.text;
        // Omit mentions from reply tweet
        if (tweet.display_text_range !== undefined && typeof tweet.display_text_range[0] === 'number') {
            logger_1.default.debug('display_text_range:', tweet.display_text_range);
            text = text.slice(tweet.display_text_range[0]);
        }
        let parser;
        const lines = text.split(/\r?\n/);
        const results = [];
        lines.forEach(line => {
            if (line.indexOf(this.prefix) !== 0) {
                return;
            }
            try {
                const textToParse = line.slice(this.prefix.length);
                parser = new nearley.Parser(grammer);
                parser.feed(textToParse);
                if (parser.results.length > 0) {
                    results.push(parser.results[0]);
                }
            }
            catch (e) {
                // logger.error(e)
            }
        });
        return results;
    }
    parseMessage(message) {
        const text = message.text;
        let parser;
        const lines = text.split(/\r?\n/);
        const results = [];
        lines.forEach(line => {
            let textToParse = line;
            if (line.indexOf(this.prefix) === 0) {
                textToParse = line.slice(this.prefix.length);
            }
            try {
                parser = new nearley.Parser(grammer);
                parser.feed(textToParse);
                if (parser.results.length > 0) {
                    results.push(parser.results[0]);
                }
            }
            catch (e) {
                // logger.error(e)
            }
        });
        return results;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map