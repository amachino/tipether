"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("winston");
logger.configure({
    level: 'debug',
    transports: [
        new logger.transports.Console({ colorize: true })
    ]
});
exports.default = logger;
//# sourceMappingURL=logger.js.map