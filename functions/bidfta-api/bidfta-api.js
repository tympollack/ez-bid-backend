const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')({ origin: true })
const firebase = require('firebase')
require('firebase/firestore')

const shareable = module.parent.shareable
const db = shareable.db

const varsUsers = shareable.config.firestore.collections.users
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
    return shareable.utils.firestoreGetThingById(db, varsUsers.name, id)
}






// const csrf = '99a57d27-e80d-4ca1-b1b6-092bc00bf33f'
// const cookie = 'AWSALB=QYzVOX9XrdhOlV6Vrm5fuvlhohLFwvq8p5coyhudjPhVvDY5eWxPpWL8/lTVcMDAtD2xm7Ihqya0a5eW2FyYgj83i3y/uZuVi5mkE+7zT6qiVzRbc+0o8DT/B904; '
//     + 'JSESSIONID=454C2E879A9338187B7B48273C55C181;'
// cors(req, res, () => {
//     const url = 'https://beta.bidfta.com/saveItemToWatchlist'
//     const params = {
//         method: 'POST',
//         mode: 'no-cors',
//         cache: 'no-cache',
//         credentials: 'same-origin',
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json',
//             'cookie': cookie,
//             'x-csrf-token': csrf
//         },
//         redirect: 'follow',
//         body: JSON.stringify({"idBidders":5195,"idItems":301532,"idAuctions":4295})
//     }
//
//     fetch(url, params)
//         .then(response => response.json().then(r => {
//             res.status(200).send(r)
//         }))
//         .catch(error => {
//             res.status(400).json(error)
//         })
// })
//
// const csrf = '99a57d27-e80d-4ca1-b1b6-092bc00bf33f'
// const cookie = 'AWSALB=QYzVOX9XrdhOlV6Vrm5fuvlhohLFwvq8p5coyhudjPhVvDY5eWxPpWL8/lTVcMDAtD2xm7Ihqya0a5eW2FyYgj83i3y/uZuVi5mkE+7zT6qiVzRbc+0o8DT/B904; '
//     + 'JSESSIONID=454C2E879A9338187B7B48273C55C181;'
// cors(req, res, () => {
//     const url = 'https://beta.bidfta.com/watchlist'
//     const params = {
//         method: 'POST',
//         mode: 'no-cors',
//         cache: 'no-cache',
//         credentials: 'same-origin',
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json',
//             'cookie': cookie,
//             'x-csrf-token': csrf
//         },
//         redirect: 'follow',
//     }
//
//     fetch(url, params)
//         .then(response => response.text().then(r => {
//             res.status(200).json(r)
//         }))
//         .catch(error => {
//             res.status(400).json(error)
//         })
// })