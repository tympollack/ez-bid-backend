const puppeteer = require('puppeteer')
const { TimeoutError } = require('puppeteer/Errors')
const waitUntilIdle = { waitUntil: 'networkidle2' }

const routes = require('express').Router()

const vars = require('./vars/vars')

routes.get('/auction/:auctionUrl', async (req, res) => {
    const auctionUrl = req.params.auctionUrl
    if (!auctionUrl) {
        res.status(400).send('No url.')
    }

    const browser = await puppeteer.launch()
    try {
        console.log('puppeteer getting auction.js items from', auctionUrl)
    } catch (e) {
        res.status(500).send(e.toString())
    } finally {
        await browser.close()
    }
})

routes.get('/cookies', async (req, res) => {
    let cookies = []
    const error = await puppetAction(testUser, testPass, async (page) => {
        cookies = await page.cookies()
        console.log('browser retrieved cookies')
        cookies.push({
            name: '_csrf',
            value: await page.$eval('head > meta[name="_csrf"]', element => element.content)
        })
        console.log('browser retrieved metadata')
    })
    if (error) {
        res.status(error.status || 500).send(error.clean)
    }
    res.status(200).send(JSON.stringify(cookies))
})

module.exports = routes

const puppetAction = async (user, pass, next) => {
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch()
    console.log('browser launched')
    try {

        const page = await browser.newPage()
        await page.goto(vars.urls.beta.login, waitUntilIdle)
        console.log('browser at new fta login screen')

        // login process
        await page.type('#username', user, { delay: 100 })
        await page.type('#password', pass, { delay: 100 })
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation(waitUntilIdle),
        ])

        const pageUrl = page.url()
        const error = Object.entries(vars.errors).find((key, val) => pageUrl.indexOf(val.dirty) > -1)
        if (error) return error

        console.log('browser logged in')
        await next(page)

    } catch (e) {
        const easter = e.toString()
        console.log('error:', easter)
        if (e instanceof TimeoutError) {
            return vars.errors.timeout
        }
        const error = Object.assign({}, vars.errors.internalServerError)
        error.clean += ' ' + easter
        return error
    } finally {
        await browser.close()
        console.log('browser closed')
    }
}