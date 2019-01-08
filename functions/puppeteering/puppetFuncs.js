const config = require('../config/config').get()
const moment = require('moment')
const utils = require('../utils')
const vars = require('../vars')

const puppeteer = require('puppeteer')
const { TimeoutError } = require('puppeteer/Errors')
const waitUntilIdle = { waitUntil: 'networkidle2' }

const puppetConfig = config.puppeteer
const auctionSelectors = puppetConfig.selectors.auctionDetails
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

// const rejectedResourceTypes = ['stylesheet', 'font', 'image']
// const rejectedDomainsRegex = /(cdnwidget.com|adroll.com|cdnbasket.net|facebook|zopim.com|zdassets.com)/

async function updateUserSession(db, page, userId) {
    const session = {}

    const cookies = await page.cookies()
    const jsessionId = findCookieByName(cookies, jsessionIdName)
    const awsalb = findCookieByName(cookies, awsalbName)
    session[fsCookie] = `${jsessionIdName}=${jsessionId};${awsalbName}=${awsalb}`

    session[fsCsrf] = await page.$eval(puppetConfig.selectors.meta.csrf, element => element.content)

    const doc = await utils.fsGetDocById(db, fsUsersCollection.name, userId)
    doc.set({
        [fsSession]: {
            ...session,
            [fsExpiration]: new Date(Date.now() + 82800000)
        }
    }, {merge: true})
    console.log('set bidfta creds for user', userId)

    return session
}

// opts: userId, bidnum, bidpw, session, forceLogin, skipLogin, db
exports.puppetAction = puppetAction

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

        let endDate = info[auctionSelectors.endDate.name] || ''
        endDate = endDate.replace(',', '').replace('rd','').replace('th', '').replace('nd', '').replace('1st', '1').split(' ')
        endDate[0] = endDate[0].substring(0, 3)
        endDate = new Date(endDate.join(' '))

        let removal = (info[auctionSelectors.removal.name] || '').replace('  ', ' ')
        const pickupIdx = removal.toLowerCase().indexOf('pickup')
        const withIdx = removal.toLowerCase().indexOf('with')
        const endIdx = pickupIdx > -1 ? pickupIdx : withIdx
        removal = removal.substring(removal.indexOf(' ') + 1, endIdx).trim()

        let numItems = info[auctionSelectors.numItems.name]
        numItems = parseInt(numItems)

        sanitaryInfos.push({
            [vars.FS_AUCTION_END_DATE]: endDate,
            [vars.FS_AUCTION_NAME]: name,
            [vars.FS_AUCTION_NUM_ITEMS]: numItems,
            [vars.FS_AUCTION_REMOVAL]: removal,
            [vars.FS_AUCTION_AUCTION_NUMBER]: info[vars.FS_AUCTION_AUCTION_NUMBER],
            [vars.FS_AUCTION_LOCATION_ADDRESS]: info[auctionSelectors.locationAddress.name],
            [vars.FS_AUCTION_TITLE]: info[auctionSelectors.title.name],
        })
    })

    return sanitaryInfos
}

exports.crawlItemInfo = async (auctionId, pageNum, startIdx, opts) => {
    const auctionDetailsUrl = `${vars.BID_AUCTION_ITEMS_URL}?${vars.BID_AUCTION_ITEMS_PARAMS_AUCTIONID}=${auctionId}&${vars.BID_AUCTION_ITEMS_PARAMS_PAGEID}=${pageNum}`
    let idsToCrawl = []
    let actionResp = await puppetAction(opts, async page => {
        await page.goto(auctionDetailsUrl, waitUntilIdle)
        console.log('browser at auction item list page', auctionDetailsUrl)

        const itemIds = await page.evaluate(selector => {
            const data = []
            document.querySelectorAll(selector).forEach(div => { data.push(div.id) })
            return data.map(d => d.replace('itemContainer', ''))
        }, vars.PUP_SEL_AUCTION_ITEMS_ITEM_DIV_LIST.selector)

        idsToCrawl = itemIds.slice(startIdx, Math.min(itemIds.length, startIdx + vars.PS_FIND_ITEMS_AMOUNT, vars.PS_MAX_ITEMS_PER_PAGE))
    })

    // return error
    if (actionResp.error || !idsToCrawl.length) return actionResp

    return crawlItems(auctionId, idsToCrawl, opts)
}

exports.crawlItems = crawlItems

/////////////////////////////////////////////////////////////////////

function addToObjectIfNotEmpty(obj, field, str = '') {
    const s = str.trim()
    if (s) obj[field] = s
}

function findCookieByName(cookies, name) {
    return cookies.find(c => c.name === name).value
}

async function crawlItems(auctionId, idsToCrawl, opts) {
    const isOldAuction = opts.skipLogin
    const unsanitaryInfos = []
    const itemDetailsUrl = vars.BID_ITEM_DETAILS_URL
        + `?${vars.BID_ITEM_DETAILS_PARAMS_SOURCE}=${vars.BID_ITEM_DETAILS_PARAMS_SOURCE_VAL}`
        + `&${vars.BID_ITEM_DETAILS_PARAMS_AUCTIONID}=${auctionId}`
        + `&${vars.BID_ITEM_DETAILS_PARAMS_ITEMID}=`

    const actionResp = await puppetAction(opts, async page => {
        for (let i = 0, len = idsToCrawl.length; i < len; i++) {
            const itemId = idsToCrawl[i]
            const itemUrl = itemDetailsUrl + itemId
            await page.goto(itemUrl, waitUntilIdle)
            console.log('browser at item page', itemUrl)

            const info = {
                [vars.FS_ITEM_AUCTION_ID]: auctionId,
                [vars.FS_ITEM_ID]: itemId
            }
            const promises = []
            Object.entries(vars.PUP_SELECTORS_ITEM_DETAILS).forEach(([key, val]) => {
                const promise = new Promise(async resolve => {
                    try {
                        switch(val.name) {
                            case vars.PUP_SEL_ITEM_DETAILS_BID_LIST_BUTTON.name:
                                break // do nothing, handled in table search

                            case vars.PUP_SEL_ITEM_DETAILS_BID_LIST_TABLE.name:
                                await Promise.all([
                                    page.click(vars.PUP_SEL_ITEM_DETAILS_BID_LIST_BUTTON.selector),
                                    page.waitForResponse(vars.CONFIG_BID_API_URLS.getBidHistoryList)
                                ])

                                const tableSelector = val.selector + itemId
                                info[val.name] = await page.evaluate((selector) => {
                                    const data = []
                                    document.querySelectorAll(`${selector} tbody tr`).forEach(tr => {
                                        const tds = tr.childNodes
                                        if (tds.length === 3) data.push({
                                            bidderId: tds[0].textContent,
                                            bidAmount: parseFloat(tds[1].textContent.replace('$ ', '')),
                                            bidDate: tds[2].textContent
                                        })
                                    })
                                    return data
                                }, tableSelector)
                                break

                            case vars.PUP_SEL_ITEM_DETAILS_PRODUCT_LINK_LIST.name:
                                info[val.name] = await page.evaluate(selector => {
                                    const data = []
                                    document.querySelectorAll(`${selector} img`).forEach(img => { data.push(img.src) })
                                    return data
                                }, val.selector)
                                break

                            case vars.PUP_SEL_ITEM_DETAILS_AUCTION_NUMBER.name:
                            case vars.PUP_SEL_ITEM_DETAILS_BRAND_NAME.name:
                            case vars.PUP_SEL_ITEM_DETAILS_LISTED_MSRP.name:
                            case vars.PUP_SEL_ITEM_DETAILS_LOCATION.name:
                            case vars.PUP_SEL_ITEM_DETAILS_MODEL.name:
                            case vars.PUP_SEL_ITEM_DETAILS_SPECS.name:
                            case vars.PUP_SEL_ITEM_DETAILS_STATUS_ADDITIONAL.name:
                            case vars.PUP_SEL_ITEM_DETAILS_TITLE.name:
                                info[val.name] = await page.evaluate(selector => {
                                    const el = document.querySelector(selector)
                                    return el ? el.nextSibling.nodeValue : ''
                                }, val.selector)
                                break

                            case vars.PUP_SEL_ITEM_DETAILS_CURRENT_BID.name:
                                info[val.name] = await page.$eval(val.selector + itemId, el => el.textContent)
                                break

                            case vars.PUP_SEL_ITEM_DETAILS_END_DATE.name:
                            case vars.PUP_SEL_ITEM_DETAILS_NEXT_BID.name:
                                if (!isOldAuction) info[val.name] = await page.$eval(val.selector + itemId, el => el.textContent)
                                break

                            default:
                                info[val.name] = await page.$eval(val.selector, el => el.textContent)
                                break
                        }
                    } catch(e) { }
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
        const bids = info[vars.PUP_SEL_ITEM_DETAILS_BID_LIST_TABLE.name]
        const sanInfo = {
            [vars.FS_ITEM_ID]: info[vars.FS_ITEM_ID],
            [vars.FS_ITEM_BIDS]: bids,
            [vars.FS_ITEM_PRODUCT_IMAGE_LINKS]: info[vars.PUP_SEL_ITEM_DETAILS_PRODUCT_LINK_LIST.name]
        }

        const currentBid = info[vars.PUP_SEL_ITEM_DETAILS_CURRENT_BID.name]
        const currentBidder = (bids.find(bid => bid.bidAmount === currentBid) || {}).bidderId

        if (currentBid) sanInfo[vars.FS_ITEM_CURRENT_BID] = parseFloat(currentBid)

        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_CURRENT_BIDDER, currentBidder)
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_NEXT_BID, info[vars.PUP_SEL_ITEM_DETAILS_NEXT_BID.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_STATUS, info[vars.PUP_SEL_ITEM_DETAILS_STATUS.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_AUCTION_NUMBER, info[vars.PUP_SEL_ITEM_DETAILS_AUCTION_NUMBER.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_BRAND_NAME, info[vars.PUP_SEL_ITEM_DETAILS_BRAND_NAME.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_ITEM_NUMBER, info[vars.PUP_SEL_ITEM_DETAILS_ITEM_NUMBER.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_LISTED_MSRP, info[vars.PUP_SEL_ITEM_DETAILS_LISTED_MSRP.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_MODEL, info[vars.PUP_SEL_ITEM_DETAILS_MODEL.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_SPECS, info[vars.PUP_SEL_ITEM_DETAILS_SPECS.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_STATUS_ADDITIONAL, info[vars.PUP_SEL_ITEM_DETAILS_STATUS_ADDITIONAL.name])
        addToObjectIfNotEmpty(sanInfo, vars.FS_ITEM_TITLE, info[vars.PUP_SEL_ITEM_DETAILS_TITLE.name])

        const location = info[vars.PUP_SEL_ITEM_DETAILS_LOCATION.name].split(',')
        sanInfo[vars.FS_ITEM_LOCATION] = [location[0].trim(), location[1].trim(), location[2].trim()].join(', ')

        const desc = info[vars.PUP_SEL_ITEM_DETAILS_DESC.name] || ''
        sanInfo[vars.FS_ITEM_DESC] = desc.replace('... Read More', '').replace('Read Less', '').trim()

        let end, endDate
        if (isOldAuction) {
            endDate = info[vars.PUP_SEL_ITEM_DETAILS_END_DATE2.name]
            if (endDate) {
                const date = endDate.match(/(\w+ \d+\w\w, 20\d\d)/)[0].replace(',', '').replace('rd','').replace('th', '').replace('nd', '').replace('1st', '1')
                const dateParts = date.split(' ')
                const month = dateParts[0].substring(0,3)
                const time = endDate.match(/(\d+:\d\d \w\w \w{3})/)[0]
                end = [month, dateParts[1], dateParts[2], time].join(' ')
                end = new Date(end)
            }
        } else {
            endDate = info[vars.PUP_SEL_ITEM_DETAILS_END_DATE.name]
            if (endDate) {
                const endTimeParts = endDate.split(' ')
                const days = endTimeParts[0]
                const time = endTimeParts[2]
                const timeParts = time.split(':')
                end = moment().add(days, 'days')
                    .add(timeParts[0], 'hours')
                    .add(timeParts[1], 'minutes')
                    .add(timeParts[2], 'seconds')
                end = new Date(end)
            }
        }
        sanInfo[vars.FS_ITEM_END_DATE] = end || ''

        sanitaryInfos.push(sanInfo)
    })

    return sanitaryInfos
}

async function puppetAction(opts, next) {
    const ret = {}
    const { userId, bidnum, bidpw, session, forceLogin, skipLogin, db } = opts
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
    console.log('browser launched')
    try {

        const page = await browser.newPage()

        // todo -- idk see if we can dig into this sometime to not load as much; seems to make puppet time out
        // await page.setRequestInterception(true)
        //
        // page.on('request', (req) => {
        //
        //     if (rejectedResourceTypes.indexOf(req.resourceType()) > -1
        //         // || match === 'images-na.ssl-images-amazon.com'
        //         // || req.url().match(rejectedDomainsRegex)
        //     ) {
        //         req.abort()
        //     }
        //     else {
        //         // const domain = req.url().replace('http://','').replace('https://','').split(/[/?#]/)[0]
        //         // if (domain !== 'www.bidfta.com') console.log(domain)
        //         req.continue()
        //     }
        // })

        if (!skipLogin) {
            // if (forceLogin || !utils.isValidSession(session)) {
            await page.goto(config.bidApiUrls.login, waitUntilIdle)
            console.log('browser at fta login screen')

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
            // } else {
            //     const split = session[fsCookie].split(';')
            //     const jessionId = split[0].replace('JESSIONID=', '')
            //     const awsalb = split[1].replace('AWSALB=', '')
            //     const cookies = [
            //         {
            //             name: 'JESSIONID',
            //             value: jessionId,
            //             domain: 'www.bidfta.com'
            //         },
            //         {
            //             name: 'AWSALB',
            //             value: awsalb,
            //             domain: 'www.bidfta.com'
            //         },
            //         {
            //             name: fsCsrf,
            //             value: session[fsCsrf],
            //             domain: 'www.bidfta.com'
            //         }
            //     ]
            //
            //     await page.setCookie(...cookies)
            // }
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