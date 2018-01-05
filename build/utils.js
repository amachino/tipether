"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
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
    static validateAddress(address) {
        if (/0x[0-9a-fA-F]{40}/.test(address) || /[0-9a-zA-Z-]+\.eth/.test(address)) {
            return true;
        }
        else {
            return false;
        }
    }
}
exports.default = Utils;
//# sourceMappingURL=utils.js.map