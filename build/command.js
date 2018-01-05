"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
function id(d) { return d[0]; }
const parser_1 = require("./parser");
const moo = require("moo");
const lexer = moo.compile({
    space: / +/,
    ens: /[0-9a-zA-Z-]+\.eth/,
    address: /0x[0-9a-fA-F]{40}/,
    username: /@[0-9a-zA-Z_]{1,15}/,
    number: /(?:[1-9][0-9]*|0)(?:\.[0-9]+)?/,
    eth: /[eE]ther|ETH|[eE]th/,
    tip: /[tT]ip/,
    otoshidama: /[oO]toshidama|お年玉/,
    withdraw: /[wW]ithdraw/,
    deposit: /[dD]eposit/,
    balance: /[bB]alance/,
    help: /[hH]elp/,
    any: /.+/
});
;
;
;
exports.Lexer = lexer;
exports.ParserRules = [
    { "name": "Main", "symbols": ["AnyCommand", "_"], "postprocess": d => d[0] },
    { "name": "Main", "symbols": ["AnyCommand", "__", "Any"], "postprocess": d => d[0] },
    { "name": "AnyCommand", "symbols": ["TipCommand"], "postprocess": id },
    { "name": "AnyCommand", "symbols": ["WithdrawCommand"], "postprocess": id },
    { "name": "AnyCommand", "symbols": ["BalanceCommand"], "postprocess": id },
    { "name": "AnyCommand", "symbols": ["DepositCommand"], "postprocess": id },
    { "name": "AnyCommand", "symbols": ["HelpCommand"], "postprocess": id },
    { "name": "AnyCommand", "symbols": ["OtoshidamaCommand"], "postprocess": id },
    { "name": "TipCommand", "symbols": ["_", (lexer.has("tip") ? { type: "tip" } : tip), "__", "Username"], "postprocess": d => ({ type: parser_1.CommandType.TIP, username: d[3] }) },
    { "name": "TipCommand", "symbols": ["TipCommand", "_", "Amount"], "postprocess": d => Object.assign(d[0], d[2]) },
    { "name": "OtoshidamaCommand", "symbols": ["_", (lexer.has("otoshidama") ? { type: "otoshidama" } : otoshidama), "__", "Username"], "postprocess": d => ({ type: parser_1.CommandType.OTOSHIDAMA, username: d[3] }) },
    { "name": "OtoshidamaCommand", "symbols": ["OtoshidamaCommand", "_", "Amount"], "postprocess": d => Object.assign(d[0], d[2]) },
    { "name": "WithdrawCommand", "symbols": ["_", (lexer.has("withdraw") ? { type: "withdraw" } : withdraw), "__", "Amount", "__", "AddressOrENS"], "postprocess": d => Object.assign({ type: parser_1.CommandType.WITHDRAW, address: d[5] }, d[3]) },
    { "name": "DepositCommand", "symbols": ["_", (lexer.has("deposit") ? { type: "deposit" } : deposit)], "postprocess": d => ({ type: parser_1.CommandType.DEPOSIT }) },
    { "name": "BalanceCommand", "symbols": ["_", (lexer.has("balance") ? { type: "balance" } : balance)], "postprocess": d => ({ type: parser_1.CommandType.BALANCE }) },
    { "name": "HelpCommand", "symbols": ["_", (lexer.has("help") ? { type: "help" } : help)], "postprocess": d => ({ type: parser_1.CommandType.HELP }) },
    { "name": "Amount", "symbols": ["Number", "_", "Symbol"], "postprocess": d => ({ amount: d[0], symbol: d[2] }) },
    { "name": "Symbol", "symbols": [(lexer.has("eth") ? { type: "eth" } : eth)], "postprocess": d => 'ETH' },
    { "name": "AddressOrENS", "symbols": ["Address"], "postprocess": id },
    { "name": "AddressOrENS", "symbols": ["ENS"], "postprocess": id },
    { "name": "Address", "symbols": [(lexer.has("address") ? { type: "address" } : address)], "postprocess": d => d[0].value },
    { "name": "ENS", "symbols": [(lexer.has("ens") ? { type: "ens" } : ens)], "postprocess": d => d[0].value },
    { "name": "Username", "symbols": [(lexer.has("username") ? { type: "username" } : username)], "postprocess": d => d[0].value.slice(1) },
    { "name": "Number", "symbols": [(lexer.has("number") ? { type: "number" } : number)], "postprocess": d => parseFloat(d[0].value) },
    { "name": "Any", "symbols": [(lexer.has("any") ? { type: "any" } : any)], "postprocess": d => d[0].value },
    { "name": "_$ebnf$1", "symbols": [(lexer.has("space") ? { type: "space" } : space)], "postprocess": id },
    { "name": "_$ebnf$1", "symbols": [], "postprocess": () => null },
    { "name": "_", "symbols": ["_$ebnf$1"], "postprocess": d => null },
    { "name": "__", "symbols": [(lexer.has("space") ? { type: "space" } : space)], "postprocess": d => null }
];
exports.ParserStart = "Main";
//# sourceMappingURL=command.js.map