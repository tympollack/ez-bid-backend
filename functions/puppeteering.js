const puppeteer = require('puppeteer')
const { TimeoutError } = require('puppeteer/Errors')
const waitUntilIdle = { waitUntil: 'networkidle2' }

const { config, db, utils } = module.parent.shareable
const puppetConfig = config.puppeteer
const auctionSelectors = puppetConfig.selectors.auction
const puppetCookies = puppetConfig.cookies
const jsessionIdName = puppetCookies.jsessionId
const awsalbName = puppetCookies.awsalb

const { firestore, httpResponses } = config
const fsAuctionsCollection = firestore.collections.auctions
const fsAuctionFields = fsAuctionsCollection.fields
const fsUsersCollection = firestore.collections.users
const fsUserFields = fsUsersCollection.fields
const sessionVars = fsUserFields.session
const fsSession = sessionVars.name
const sessionFields = sessionVars.fields
const fsCookie = sessionFields.cookie.name
const fsCsrf = sessionFields.csrf.name
const fsExpiration = sessionFields.expiration.name

//    /puppeteering/puppeteering/
const routes = require('express').Router()

routes.get('/', (req, res) => { res.send('poop') })

routes.get('/auction/:auctionId', crawlAuctionInfo)

routes.use('/users', verifyUserId)
routes.post('/users/session', routeUsersSession)

module.exports = routes

/////////////////////////////////////////////////////////////////////

const puppetAction = async (req, res, next) => {
    const ret = {}
    const { userId, bidnum, bidpw, session, forceLogin, skipLogin } = res.locals
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch()
    console.log('browser launched')
    try {

        const page = await browser.newPage()

        if (!skipLogin) {
            if (forceLogin || !isValidSession(session)) {
                await page.goto(config.bidApiUrls.login, waitUntilIdle)
                console.log('browser at new fta login screen')

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
            } else {
                await page.setCookie(
                    {
                        name: fsCookie,
                        value: session[fsCookie],
                        domain: 'www.bidfta.com'
                    },
                    {
                        name: fsCsrf,
                        value: session[fsCsrf],
                        domain: 'www.bidfta.com'
                    }
                )
            }
        }

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
    const userId = req.body.userId || res.locals.userId
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
    res.locals.bidnum = user[fsUserFields.bidnum.name]
    res.locals.bidpw = user[fsUserFields.bidpw.name]
    res.locals.session = user[fsUserFields.session.name]
    if (next) next()
}

async function routeUsersSession(req, res) {
    res.locals.forceLogin = true
    const userSession = await puppetAction(req, res)
    const error = userSession.error
    if (error) {
        res.status(error.status || 500).send(error.clean)
        return
    }
    res.json(userSession.session)
}

async function crawlAuctionInfo(req, res) {
    const auctionId = req.params.auctionId
    if (!auctionId) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    res.locals.userId = firestore.serviceAccount.userId
    res.locals.skipLogin = true
    await verifyUserId(req, res)

    const info = {}
    const actionResp = await puppetAction(req, res, async page => {
        const auctionDetailsConfig = config.bidApiUrls.auctionDetails
        const auctionUrl = `${auctionDetailsConfig.url}?${auctionDetailsConfig.params.auctionId}=${auctionId}`
        await page.goto(auctionUrl, waitUntilIdle)
        console.log('browser at auction page', auctionUrl)

        const promises = []
        Object.entries(auctionSelectors).forEach(([key, val]) => {
            const promise = new Promise(async resolve => {
                let ret = ''
                try {
                    ret = await page.$eval(val, el => el.textContent)
                } catch(e) {}
                info[key] = ret
                resolve()
            })
            promises.push(promise)
        })
        await Promise.all(promises)

    })

    // sanitize
    const name = info.name || ''
    info.name = name.substring(name.indexOf(' ') + 1)

    const endDate = info.endDate.replace(',', '').replace('th', '').replace('nd', '').replace('1st', '1').split(' ')
    endDate[0] = endDate[0].substring(0,3)
    info.endDate = new Date(endDate.join(' '))

    const removal = info.removal.replace('  ', ' ')
    info.removal = removal.substring(removal.indexOf(' ') + 1, removal.indexOf('Pickup')).trim()

    res.json(actionResp.error || info)
}

async function crawlWatchlist(req, res) {
    const error = await puppetAction(req, res, async (page) => {

    })

    if (error) {
        return { error: error }
    }

}

async function updateUserSession(page, userId) {
    const session = {}

    const cookies = await page.cookies()
    console.log(cookies)
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

/////////////////////////////////////////////////////////////////////

function findCookieByName(cookies, name) {
    return cookies.find(c => c.name === name).value
}

function isValidSession(session) {
    return session && session[fsCookie] && session[fsCsrf] && session[fsExpiration] && session[fsExpiration] > Date.now()
}