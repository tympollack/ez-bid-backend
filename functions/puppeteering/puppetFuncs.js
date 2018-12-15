const config = require('../config/config').get()
const utils = require('../utils')

const puppeteer = require('puppeteer')
const { TimeoutError } = require('puppeteer/Errors')
const waitUntilIdle = { waitUntil: 'networkidle2' }

const puppetConfig = config.puppeteer
const auctionSelectors = puppetConfig.selectors.auction
const puppetCookies = puppetConfig.cookies
const jsessionIdName = puppetCookies.jsessionId
const awsalbName = puppetCookies.awsalb

const { firestore, httpResponses } = config
const fsUsersCollection = firestore.collections.users
const fsUserFields = fsUsersCollection.fields
const sessionVars = fsUserFields.session
const fsSession = sessionVars.name
const sessionFields = sessionVars.fields
const fsCookie = sessionFields.cookie.name
const fsCsrf = sessionFields.csrf.name
const fsExpiration = sessionFields.expiration.name

function findCookieByName(cookies, name) {
    return cookies.find(c => c.name === name).value
}

function isValidSession(session) {
    return session && session[fsCookie] && session[fsCsrf] && session[fsExpiration] && session[fsExpiration] > Date.now()
}

async function getFsUserSession(db, userId) {
    const user = await utils.fsGetObjectById(db, fsUsersCollection.name, userId)
    if (!user) {
        return
    }

    return {
        userId: userId,
        bidnum: user[fsUserFields.bidnum.name],
        bidpw: user[fsUserFields.bidpw.name],
        session: user[fsUserFields.session.name]
    }
}

async function updateUserSession(db, page, userId) {
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

// opts: userId, bidnum, bidpw, session, forceLogin, skipLogin, db
async function puppetAction(opts, next) {
    const ret = {}
    const { userId, bidnum, bidpw, session, forceLogin, skipLogin, db } = opts
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
                ret.session = await updateUserSession(db, page, userId)
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

async function crawlAuctionInfo(auctionId, opts) {
    const info = {}
    const actionResp = await puppetAction(opts, async page => {
        const auctionDetailsConfig = config.bidApiUrls.auctionDetails
        const auctionUrl = `${auctionDetailsConfig.url}?${auctionDetailsConfig.params.auctionId}=${auctionId}`
        await page.goto(auctionUrl, waitUntilIdle)
        console.log('browser at auction page', auctionUrl)

        const promises = []
        Object.entries(auctionSelectors).forEach(([key, val]) => {
            const promise = new Promise(async resolve => {
                try {
                    info[key] = await page.$eval(val, el => el.textContent)
                } catch(e) {}
                resolve()
            })
            promises.push(promise)
        })
        await Promise.all(promises)
    })

    if (!info.name) return actionResp.error

    // sanitize
    const name = info.name
    info.name = name.substring(name.indexOf(' ') + 1)

    const endDate = info.endDate.replace(',', '').replace('th', '').replace('nd', '').replace('1st', '1').split(' ')
    endDate[0] = endDate[0].substring(0, 3)
    info.endDate = new Date(endDate.join(' '))

    const removal = info.removal.replace('  ', ' ')
    info.removal = removal.substring(removal.indexOf(' ') + 1, removal.indexOf('Pickup')).trim()

    return info
}

module.exports = {
    crawlAuctionInfo: crawlAuctionInfo,
    getFsUserSession: getFsUserSession,
    isValidSession: isValidSession,
    puppetAction: puppetAction,
}