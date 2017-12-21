"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nearley = require("nearley");
const command = require("./command.js");
var CommandType;
(function (CommandType) {
    CommandType["TIP"] = "tip";
    CommandType["WITHDRAW"] = "withdraw";
    CommandType["DEPOSIT"] = "deposit";
    CommandType["BALANCE"] = "balance";
    CommandType["CANCEL"] = "cancel";
    CommandType["HELP"] = "help";
})(CommandType = exports.CommandType || (exports.CommandType = {}));
class CommandParser {
    static parse(text) {
        let parser;
        const grammer = nearley.Grammar.fromCompiled(command);
        const lines = text.split(/\r?\n/);
        const results = [];
        lines.forEach(line => {
            try {
                parser = new nearley.Parser(grammer);
                parser.feed(line);
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
exports.CommandParser = CommandParser;
//# sourceMappingURL=command_parser.js.map