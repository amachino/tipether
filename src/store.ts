import * as firebase from 'firebase-admin'
import config from './config'

export const app = firebase.initializeApp({
  credential: firebase.credential.cert({
    projectId: config.FIREBASE_PROJECT_ID,
    clientEmail: config.FIREBASE_CLIENT_EMAIL,
    privateKey: config.FIREBASE_PRIVATE_KEY
  }),
  databaseURL: config.FIREBASE_DATABASE_URL
})

export default app.firestore()
