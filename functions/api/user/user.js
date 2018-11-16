const express = require('express')
const cors = require('cors')({ origin: true })
const bodyParser = require('body-parser')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

const master = require('../../index')
const db = master.db

const utils = require('../../utils')
const vars = require('../../vars/vars')
const collection = vars.firestore.collections.users.name

const userApp = express()
userApp.use(cors)
userApp.use(bodyParser.json())

// /user/userid
// /user/userid/watching/itemid
// /user/userid/bids/bidid
// /user/userid/won/itemid

exports.userInfo = require('./userInfo')


