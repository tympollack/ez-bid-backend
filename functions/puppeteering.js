const puppeteer = require('puppeteer')
const { TimeoutError } = require('puppeteer/Errors')
const waitUntilIdle = { waitUntil: 'networkidle2' }

const routes = require('express').Router()

const config = module.parent.shareable.config
const errors = config.httpResponses
const puppetConfig = config.puppeteer
const sessionFields = config.firestore.collections.users.fields.session.fields

routes.get('/auction/:auctionUrl', async (req, res) => {
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
})

routes.post('/session', async (req, res) => {
    const ret = {}
    const { userId, pw } = req.body
    const error = await puppetAction(userId, pw, async (page) => {
        ret[sessionFields.cookie.name] = await page.cookies()
        console.log('browser retrieved cookies')
        ret[sessionFields.csrf.name] = await page.$eval(puppetConfig.selectors.meta.csrf, element => element.content)
        console.log('browser retrieved metadata')
    })
    if (error) {
        res.status(error.status || 500).send(error.clean)
        return
    }
    res.status(200).json(ret)
})

module.exports = routes

/////////////////////////////////////////////////////////////////////

const puppetAction = async (user, pass, next) => {
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch()
    console.log('browser launched')
    try {

        const page = await browser.newPage()
        await page.goto(config.urls.login, waitUntilIdle)
        console.log('browser at new fta login screen')

        // login process
        const loginSelectors = puppetConfig.selectors.login
        await page.type(loginSelectors.username, user, { delay: 100 })
        await page.type(loginSelectors.password, pass, { delay: 100 })
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation(waitUntilIdle),
        ])

        const pageUrl = page.url()
        const error = Object.entries(errors).find((key, val) => pageUrl.indexOf(val.dirty) > -1)
        if (error) return error

        console.log('browser logged in')
        await next(page)

    } catch (e) {
        const easter = e.toString()
        console.log('error:', easter)
        if (e instanceof TimeoutError) {
            return errors.timeout
        }
        const error = Object.assign({}, errors.internalServerError)
        error.clean += ' ' + easter
        return error
    } finally {
        await browser.close()
        console.log('browser closed')
    }
}