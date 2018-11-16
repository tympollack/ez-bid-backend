const express = require('express')
const functions = require('firebase-functions')
const bodyParser = require('body-parser')
const cors = require('cors')({ origin: true })
const vars = require('./vars/vars')
const firebase = require('firebase')
require('firebase/firestore')

const master = require('../index')
const db = master.db

const betaApp = express()
betaApp.use(cors)
betaApp.use(bodyParser.json)
betaApp.use(async (req, res, next) => {
    // if cookies don't exist or are expired, log in and set cookies in firestore

    req.locals.cookie = ''
    req.locals.csrf = ''

    next()
})

betaApp.get('/:userId/watchlist', (req, res) => {

})

const getUserById = id => {
    return utils.firestoreGetThingById(db, collection, id)
}