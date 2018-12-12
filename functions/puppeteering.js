const puppeteer = require('puppeteer')
const { TimeoutError } = require('puppeteer/Errors')
const waitUntilIdle = { waitUntil: 'networkidle2' }

const { config, db, utils } = module.parent.shareable
const puppetConfig = config.puppeteer
const puppetCookies = puppetConfig.cookies
const jsessionIdName = puppetCookies.jsessionId
const awsalbName = puppetCookies.awsalb

const { firestore, httpResponses } = config
const fsUsersCollection = firestore.collections.users
const fsUsersCollectionFields = fsUsersCollection.fields
const sessionVars = fsUsersCollectionFields.session
const fsSession = sessionVars.name
const sessionFields = sessionVars.fields
const fsCookie = sessionFields.cookie.name
const fsCsrf = sessionFields.csrf.name
const fsExpiration = sessionFields.expiration.name

//    /puppeteering/
const routes = require('express').Router()
routes.use('/users', verifyUserId)

routes.get('/', (req, res) => { res.send('poop') })

routes.get('/auction/:auctionUrl', crawlAuctionInfo)

routes.post('/users/session', async (req, res) => {
    const userSession = await puppetAction(req, res)
    const error = userSession.error
    if (error) {
        res.status(error.status || 500).send(error.clean)
        return
    }
    res.json(userSession.session)
})

module.exports = routes

/////////////////////////////////////////////////////////////////////

const puppetAction = async (req, res, next) => {
    const ret = {}
    const { userId, bidnum, bidpw } = res.locals
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch()
    console.log('browser launched')
    try {

        const page = await browser.newPage()
        await page.goto(config.bidApiUrls.login, waitUntilIdle)
        console.log('browser at new fta login screen')

        // login process
        const loginSelectors = puppetConfig.selectors.login
        await page.type(loginSelectors.username, bidnum, { delay: 100 })
        await page.type(loginSelectors.password, bidpw, { delay: 100 })
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation(waitUntilIdle),
        ])

        const pageUrl = page.url()
        const error = Object.entries(httpResponses).find((key, val) => pageUrl.indexOf(val.dirty) > -1)
        if (error) {
            ret.error = error
            return ret
        }

        console.log('browser logged in')
        ret.session = await updateUserSession(page, userId)

        if (next) await next(page)

        return ret
    } catch (e) {
        const easter = e.toString()
        console.log('error:', easter)
        if (e instanceof TimeoutError) {
            ret.error = httpResponses.timeout
        } else {
            ret.error = Object.assign({}, httpResponses.internalServerError)
            ret.error.clean += ' ' + easter
        }
        return ret
    } finally {
        await browser.close()
        console.log('browser closed')
    }
}

async function verifyUserId(req, res, next) {
    const userId = req.body.userId
    if (!userId) {
        utils.sendHttpResponse(res, httpResponses.noUserId)
        return
    }

    const user = await utils.fsGetObjectById(db, fsUsersCollection.name, userId)
    if (!user) {
        console.error('user not found for id', id)
        utils.sendHttpResponse(res, httpResponses.notFound)
        return
    }

    res.locals.userId = userId
    res.locals.bidnum = user[fsUsersCollectionFields.bidnum.name]
    res.locals.bidpw = user[fsUsersCollectionFields.bidpw.name]
    next()
}

async function crawlAuctionInfo(req, res) {
    const auctionUrl = req.params.auctionUrl
    if (!auctionUrl) {
        res.status(400).send('No url.')
    }

    const browser = await puppeteer.launch()
    try {
        console.log('puppeteer getting auction.js items from', auctionUrl)
    } catch (e) {
        res.status(500).send('' + e)
    } finally {
        await browser.close()
    }
}

async function crawlWatchlist(userId) {
    const { userId, bidnum, bidpw } = res.locals
    const error = await puppetAction(bidnum, bidpw, async (page) => {

    })

    if (error) {
        return { error: error }
    }

}

async function updateUserSession(page, userId) {
    const session = {}

    const cookies = await page.cookies()
    const jsessionId = findCookieByName(cookies, jsessionIdName)
    const awsalb = findCookieByName(cookies, awsalbName)
    session[fsCookie] = `${jsessionIdName}=${jsessionId};${awsalbName}=${awsalb}`

    session[fsCsrf] = await page.$eval(puppetConfig.selectors.meta.csrf, element => element.content)

    const doc = await utils.fsGetDocById(db, fsUsersCollection.name, userId)
    await doc.set({
        [fsSession]: {
            ...session,
            [fsExpiration]: Date.now() + 82800000
        }
    }, {merge: true})
    console.log('set bidfta creds for user', userId)

    return session
}

// todo remove; committing for historical purposes
async function getNewUserSession(req, res) {
    const session = {}
    const { userId, bidnum, bidpw } = res.locals
    const error = await puppetAction(bidnum, bidpw, async (page) => {
        const cookies = await page.cookies()
        const jsessionId = findCookieByName(cookies, jsessionIdName)
        const awsalb = findCookieByName(cookies, awsalbName)
        session[fsCookie] = `${jsessionIdName}=${jsessionId};${awsalbName}=${awsalb}`
        console.log('browser retrieved cookies')
        session[fsCsrf] = await page.$eval(puppetConfig.selectors.meta.csrf, element => element.content)
        console.log('browser retrieved metadata')
    })

    if (error) {
        return { error: error }
    }

    const doc = await utils.fsGetDocById(db, fsUsersCollection.name, userId)
    doc.set({
        [fsSession]: {
            ...session,
            [fsExpiration]: Date.now() + 82800000
        }
    }, {merge: true})
    console.log('set bidfta creds for user', userId)

    return { session: session }
}

/////////////////////////////////////////////////////////////////////

function findCookieByName(cookies, name) {
    return cookies.find(c => c.name === name).value
}