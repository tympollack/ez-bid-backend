const config = require('../config/config').get()
const utils = require('../utils')
const vars = require('../vars')

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
            [fsExpiration]: new Date(Date.now() + 82800000)
        }
    }, {merge: true})
    console.log('set bidfta creds for user', userId)

    return session
}

// opts: userId, bidnum, bidpw, session, forceLogin, skipLogin, db
exports.puppetAction = async (opts, next) => {
    const ret = {}
    const { userId, bidnum, bidpw, session, forceLogin, skipLogin, db } = opts
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
    console.log('browser launched')
    try {

        const page = await browser.newPage()

        if (!skipLogin) {
            if (forceLogin || !utils.isValidSession(session)) {
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
                const cookie = {
                    name: fsCookie,
                    value: session[fsCookie],
                    domain: 'www.bidfta.com'
                }
                const csrf = {
                    name: fsCsrf,
                    value: session[fsCsrf],
                    domain: 'www.bidfta.com'
                }

                console.log('cookie:', cookie)
                console.log('csrf:', csrf)
                // await page.setCookie(cookie, csrf)
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

exports.crawlAuctionInfo = async (auctionIds, opts) => {
    const unsanitaryInfos = []
    const auctionDetailsConfig = config.bidApiUrls.auctionDetails
    const auctionDetailsUrl = `${auctionDetailsConfig.url}?${auctionDetailsConfig.params.auctionId}=`
    const actionResp = await this.puppetAction(opts, async page => {
        for (let i = 0, len = auctionIds.length; i < len; i++) {
            const auctionNum = auctionIds[i]
            const auctionUrl = auctionDetailsUrl + auctionNum
            await page.goto(auctionUrl, waitUntilIdle)
            console.log('browser at auction page', auctionUrl)

            const info = { [vars.FS_AUCTION_AUCTION_NUMBER]: auctionNum }
            const promises = []
            Object.entries(auctionSelectors).forEach(([key, val]) => {
                const promise = new Promise(async resolve => {
                    try {
                        info[val.name] = await page.$eval(val.selector, el => el.textContent)
                    } catch(e) {}
                    resolve()
                })
                promises.push(promise)
            })
            await Promise.all(promises)
            unsanitaryInfos.push(info)
        }
    })

    // return error
    if (actionResp.error || !unsanitaryInfos.length) return actionResp

    // sanitize
    const sanitaryInfos = []
    unsanitaryInfos.forEach(info => {
        let name = info[auctionSelectors.name.name]
        if (!name) {
            sanitaryInfos.push(info)
            return
        }
        name = name.substring(name.indexOf(' ') + 1)

        let endDate = (info[auctionSelectors.endDate.name] || '').replace(',', '').replace('th', '').replace('nd', '').replace('1st', '1').split(' ')
        endDate[0] = endDate[0].substring(0, 3)
        endDate = new Date(endDate.join(' '))

        let removal = (info[auctionSelectors.removal.name] || '').replace('  ', ' ')
        const pickupIdx = removal.toLowerCase().indexOf('pickup')
        const withIdx = removal.toLowerCase().indexOf('with')
        const endIdx = pickupIdx > -1 ? pickupIdx : withIdx
        removal = removal.substring(removal.indexOf(' ') + 1, endIdx).trim()

        sanitaryInfos.push({
            [vars.FS_AUCTION_NAME]: name,
            [vars.FS_AUCTION_END_DATE]: endDate,
            [vars.FS_AUCTION_REMOVAL]: removal,
            [vars.FS_AUCTION_AUCTION_NUMBER]: info[vars.FS_AUCTION_AUCTION_NUMBER],
            [vars.FS_AUCTION_LOCATION_ADDRESS]: info[auctionSelectors.locationAddress.name],
            [vars.FS_AUCTION_NUM_ITEMS]: info[auctionSelectors.numItems.name],
            [vars.FS_AUCTION_TITLE]: info[auctionSelectors.title.name],
        })
    })

    return sanitaryInfos
}