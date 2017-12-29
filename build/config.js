"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
exports.default = {
    API_ACCESS_TOKEN: process.env.API_ACCESS_TOKEN,
    API_BASE_URL: process.env.API_BASE_URL,
    API_FUNC_GET_ADDRESS: process.env.API_FUNC_GET_ADDRESS,
    API_FUNC_GET_BALANCE: process.env.API_FUNC_GET_BALANCE,
    API_FUNC_TIP_ETHER: process.env.API_FUNC_TIP_ETHER,
    API_FUNC_WITHDRAW_ETHER: process.env.API_FUNC_WITHDRAW_ETHER,
    TWITTER_ID: process.env.TWITTER_ID,
    TWITTER_SCREEN_NAME: process.env.TWITTER_SCREEN_NAME,
    TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL
};
//# sourceMappingURL=config.js.map