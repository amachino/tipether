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
const axios_1 = require("axios");
const config_1 = require("./config");
class API {
    static getAddress(data) {
        return this.call(config_1.default.API_FUNC_GET_ADDRESS, data);
    }
    static getBalance(data) {
        return this.call(config_1.default.API_FUNC_GET_BALANCE, data);
    }
    static tipEther(data) {
        return this.call(config_1.default.API_FUNC_TIP_ETHER, data);
    }
    static withdrawEther(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.call(config_1.default.API_FUNC_WITHDRAW_ETHER, data);
        });
    }
    static call(name, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield axios_1.default({
                url: name,
                method: 'post',
                baseURL: config_1.default.API_BASE_URL,
                data: data,
                headers: { Authorization: `Bearer ${config_1.default.API_ACCESS_TOKEN}` }
            });
            return result.data;
        });
    }
}
exports.default = API;
//# sourceMappingURL=api.js.map