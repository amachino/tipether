"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase = require("firebase-admin");
const config_1 = require("./config");
exports.app = firebase.initializeApp({
    credential: firebase.credential.cert({
        projectId: config_1.default.FIREBASE_PROJECT_ID,
        clientEmail: config_1.default.FIREBASE_CLIENT_EMAIL,
        privateKey: config_1.default.FIREBASE_PRIVATE_KEY
    }),
    databaseURL: config_1.default.FIREBASE_DATABASE_URL
});
exports.default = exports.app.firestore();
//# sourceMappingURL=store.js.map