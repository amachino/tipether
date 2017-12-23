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
const store_1 = require("./store");
var Type;
(function (Type) {
    Type["TIP"] = "TIP";
    Type["WITHDRAW"] = "WITHDRAW";
})(Type || (Type = {}));
class Receipt {
    static get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield store_1.default.collection(this.collection).doc(id).get();
            if (doc.exists) {
                return doc.data();
            }
            else {
                return null;
            }
        });
    }
    static createTipReceipt(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().getTime();
            return store_1.default.collection(this.collection).doc(id).set(Object.assign({ type: Type.TIP }, data, { createdAt: now }));
        });
    }
    static createWithdrawReceipt(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().getTime();
            return store_1.default.collection(this.collection).doc(id).set(Object.assign({ type: Type.WITHDRAW }, data, { createdAt: now }));
        });
    }
}
Receipt.collection = 'receipts';
exports.default = Receipt;
//# sourceMappingURL=receipt.js.map