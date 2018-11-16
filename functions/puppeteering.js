const express = require('express')
const functions = require('firebase-functions')
const bodyParser = require('body-parser')
const cors = require('cors')({ origin: true })
const vars = require('./vars/vars')
const puppeteer = require('puppeteer')
const puppetOpts = {memory: '2GB', timeoutSeconds: 60}
const { TimeoutError } = require('puppeteer/Errors')

const puppeteeringApp = express()
puppeteeringApp.use(bodyParser.json())
puppeteeringApp.use(bodyParser.text())
puppeteeringApp.use(cors)

const waitUntilIdle = { waitUntil: 'networkidle2' }
const testUser = 'xxx'
const testPass = 'xxx'

puppeteeringApp.get('/beta-auction/:auctionUrl', async (req, res) => {
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

puppeteeringApp.get('/dashboard/watchlist', async (req, res) => {
    let buffer
    const error = await executeBeta(testUser, testPass, async (page) => {
        await page.goto(vars.urls.beta.watchlist, waitUntilIdle)
        console.log('browser at user watchlist screen')

        buffer = await page.screenshot({ fullPage: true })
        console.log('browser took screenshot')
    })
    if (error) {
        res.status(error.status || 500).send(error.clean)
    }
    res.status(200).type('image/png').send(buffer)
})

puppeteeringApp.get('/beta-cookies', async (req, res) => {
    let cookies = []
    const error = await executeBeta(testUser, testPass, async (page) => {
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

puppeteeringApp.get('/test-login', async (req, res) => {
    let cookies = []
    const error = await executeBeta(testUser, testPass, async (page) => {
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

    const csrf = cookies.find(obj => obj.name === '_csrf').value
    const jsessionid = cookies.find(obj => obj.name.toUpperCase() === 'JSESSIONID').value
    const cookie = cookies.map(obj => obj.name + '=' + obj.value).join('; ')
    console.log(csrf, jsessionid, cookie)

    let stupidError

    await cors(req, res, async () => {
        const url = 'https://beta.bidfta.com/watchlist?_csrf=' + csrf
        const params = {
            _csrf: csrf,
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            origin: 'https://beta.bidfta.com',
            credentials: 'same-origin',
            headers: {
                'authority': 'beta.bidfta.com',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'cookie': cookie,
                'x-csrf-token': csrf,
                'x-requested-with': 'XMLHttpRequest'
            },
            redirect: 'follow',
            referrer: 'https://beta.bidfta.com/dashboard?source=watchlist',
        }

        await fetch(url, params)
            .then(response => response.text().then(r => {
                res.status(200).send(JSON.stringify(r))
            }))
            .catch(error => {
                res.status(400).send(JSON.stringify(error))
            })
    })

    // res.status(200).send(JSON.stringify(stupidError || cookies))
})

puppeteeringApp.get('/test-session', (req, res) => {
    const csrf = '99a57d27-e80d-4ca1-b1b6-092bc00bf33f'
    const cookie = 'AWSALB=QYzVOX9XrdhOlV6Vrm5fuvlhohLFwvq8p5coyhudjPhVvDY5eWxPpWL8/lTVcMDAtD2xm7Ihqya0a5eW2FyYgj83i3y/uZuVi5mkE+7zT6qiVzRbc+0o8DT/B904; '
                 + 'JSESSIONID=454C2E879A9338187B7B48273C55C181;'
    cors(req, res, () => {
        const url = 'https://beta.bidfta.com/watchlist'
        const params = {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'cookie': cookie,
                'x-csrf-token': csrf
            },
            redirect: 'follow',
        }

        fetch(url, params)
            .then(response => response.text().then(r => {
                res.status(200).send(JSON.stringify(r))
            }))
            .catch(error => {
                res.status(400).send(JSON.stringify(error))
            })
    })
})


puppeteeringApp.get('/saveItemToWatchlist', (req, res) => {
    const csrf = '99a57d27-e80d-4ca1-b1b6-092bc00bf33f'
    const cookie = 'AWSALB=QYzVOX9XrdhOlV6Vrm5fuvlhohLFwvq8p5coyhudjPhVvDY5eWxPpWL8/lTVcMDAtD2xm7Ihqya0a5eW2FyYgj83i3y/uZuVi5mkE+7zT6qiVzRbc+0o8DT/B904; '
        + 'JSESSIONID=454C2E879A9338187B7B48273C55C181;'
    cors(req, res, () => {
        const url = 'https://beta.bidfta.com/saveItemToWatchlist'
        const params = {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'cookie': cookie,
                'x-csrf-token': csrf
            },
            redirect: 'follow',
            body: JSON.stringify({"idBidders":xxx,"idItems":301532,"idAuctions":4295})
        }

        fetch(url, params)
            .then(response => response.json().then(r => {
                res.status(200).send(r)
            }))
            .catch(error => {
                res.status(400).send(JSON.stringify(error))
            })
    })
})

exports.puppeteering = functions.runWith(puppetOpts).https.onRequest(puppeteeringApp)

const executeBeta = async (user, pass, next) => {
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