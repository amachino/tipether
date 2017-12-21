"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nearley = require("nearley");
const command = require("./command");
var CommandType;
(function (CommandType) {
    CommandType["TIP"] = "tip";
    CommandType["WITHDRAW"] = "withdraw";
    CommandType["DEPOSIT"] = "deposit";
    CommandType["BALANCE"] = "balance";
    CommandType["HELP"] = "help";
})(CommandType = exports.CommandType || (exports.CommandType = {}));
class Parser {
    constructor(obj) {
        this.botName = '@' + obj.botName;
    }
    parse(text) {
        let parser;
        const grammer = nearley.Grammar.fromCompiled(command);
        const lines = text.split(/\r?\n/);
        const results = [];
        lines.forEach(line => {
            if (line.indexOf(this.botName) !== 0) {
                return;
            }
            try {
                const text = line.slice(this.botName.length);
                parser = new nearley.Parser(grammer);
                parser.feed(text);
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