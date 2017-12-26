"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Util {
    static normalizeToEth(symbol, amount) {
        if (symbol.toUpperCase() === 'ETH') {
            return amount;
        }
        else if (symbol.toUpperCase() === 'WEI') {
            return amount / 10e18;
        }
        else {
            throw new Error(`Invalid symbol: should be either "ETH" or "Wei"`);
        }
    }
}
exports.default = Util;
//# sourceMappingURL=util.js.map