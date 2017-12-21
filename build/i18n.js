"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const i18n = require("i18n");
i18n.configure({
    directory: path.join(__dirname + '/../locales')
});
exports.default = i18n;
//# sourceMappingURL=i18n.js.map