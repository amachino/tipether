"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const i18n = require("i18n");
i18n.configure({
    directory: path.join(__dirname + '/../locales')
});
const locales = ['en', 'ja'];
const defaultLocale = 'en';
function __(obj, data) {
    let locale = obj.locale;
    if (locales.indexOf(locale) === -1) {
        locale = defaultLocale;
    }
    return i18n.__({ phrase: obj.phrase, locale: locale }, data);
}
exports.default = __;
//# sourceMappingURL=i18n.js.map