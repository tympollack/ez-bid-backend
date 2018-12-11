const { config, db, utils } = module.parent.shareable

const { firestore, httpResponses } = config
const fsUsersCollection = firestore.collections.users
const sessionVars = fsUsersCollection.fields.session
const fsSession = sessionVars.name
const sessionFields = sessionVars.fields
const fsCookie = sessionFields.cookie.name
const fsCsrf = sessionFields.csrf.name
const fsExpiration = sessionFields.expiration.name

const routes = require('express').Router()
routes.param('userId', getSessionVars)
routes.get('/users/:userId/watchlist', getWatchlist)

module.exports = routes

/////////////////////////////////////////////////////////////////////

const getUserById = id => {
    return utils.fsGetObjectById(db, fsUsersCollection.name, id)
}

const getUserDoc = id => {
    return utils.fsGetDocById(db, fsUsersCollection.name, id)
}

async function getSessionVars(req, res, next) {
    const userId = req.params.userId
    if (!userId) {
        res.status(400).send('No user id supplied.')
        return
    }

    const user = await getUserById(userId)
    if (!user) {
        console.error('user not found for id', id)
        res.status(404).send()
        return
    }

    const timestamp = new Date().getTime()
    const session = user[fsSession]
    if (!session || !session[fsCookie] || !session[fsCsrf] || !session[fsExpiration] || session[fsExpiration] < timestamp) {
        const e = await utils.createTask('loginqueue', user.id) ? httpResponses.networkAuthenticationRequired : httpResponses.failedDependency
        res.status(e.status).send(e.clean)
        return
    }

    req.locals.cookie = session[fsCookie]
    req.locals.csrf = session[fsCsrf]
    next()
}

async function getWatchlist(req, res) {
    res.json(req)
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