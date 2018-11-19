const express = require('express')
const functions = require('firebase-functions')
const bodyParser = require('body-parser')
const cors = require('cors')({ origin: true })
const firebase = require('firebase')
require('firebase/firestore')

const master = require('../index')
const db = master.db

const vars = require('./vars/vars')
const varsUsers = vars.firestore.collections.users
const varsSession = varsUsers.fields.session
const sessionFields = varsSession.fields

const betaApp = express()
betaApp.use(cors)
betaApp.use(bodyParser.json)
betaApp.use(async (req, res, next) => {
    const userId = req.params.userId
    if (!userId) {
        res.status(400).send('No user id supplied.')
        return
    }

    const userDoc = await getUserById(userId)
    if (!userDoc) {
        console.error('user not found for id', id)
        res.status(404).send()
        return
    }

    const timestamp = new Date().getTime()
    let session = userDoc.get(varsSession.name)
    if (!session
        || !session[sessionFields.cookie.name]
        || !session[sessionFields.csrf.name]
        || session[sessionFields.expiration.name] < timestamp) {
        // if session vars don't exist or are expired, call puppet session func
        session = {} // todo add to login task queue -> puppet func
        session[sessionFields.expiration.name] = timestamp + (24 * 3600 * 1000) // add 24 hrs
        userDoc.update({ [varsSession.name]: session })
    }

    req.locals.cookie = session[sessionFields.cookie.name]
    req.locals.csrf = session[sessionFields.csrf.name]

    next()
})

betaApp.get('/:userId/watchlist', (req, res) => {

})

const getUserById = id => {
    return utils.firestoreGetThingById(db, varsUsers.name, id)
}