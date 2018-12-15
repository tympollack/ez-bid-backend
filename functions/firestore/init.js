const admin = require('firebase-admin')
const functions = require('firebase-functions')
require('firebase/firestore')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

module.exports = db