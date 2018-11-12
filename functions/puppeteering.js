const express = require('express')
const functions = require('firebase-functions')
const bodyParser = require('body-parser')
const utils = require('./utils')
const vars = require('./vars')
const puppeteer = require('puppeteer')
const puppetOpts = {memory: '2GB', timeoutSeconds: 60}
const { TimeoutError } = require('puppeteer/Errors')

const puppeteeringApp = express()
puppeteeringApp.use(bodyParser.json())
puppeteeringApp.use(utils.reqWrapper)

const waitUntilIdle = { waitUntil: 'networkidle2' }
const errorBadCredentials = 'error=Bad%20credentials'
const testUser = 'asd'
const testPass = 'xxx'

exports.screenshotTest = functions.runWith(puppetOpts).https.onRequest(async (req, res) => {
    const url = req.query.url

    if (!url) {
        return res.status(400).send('No url.')
    }

    const browser = await puppeteer.launch()
    try {
        const page = await browser.newPage()

        console.log(url)
        await page.goto(url, { waitUntil: 'networkidle0' })

        const buffer = await page.screenshot({ fullPage: true })
        res.type('image/png').send(buffer)
    } catch(e) {
        res.status(500).send(e.toString())
    } finally {
        await browser.close()
    }
})

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
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch()
    console.log('browser launched')
    try {

        const page = await browser.newPage()
        await Promise.all([
            page.goto('https://beta.bidfta.com/login'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ])
        console.log('browser at new fta login screen')

        // login process
        await page.type('#username', '5195', { delay: 100 })
        await page.type('#password', 'Neocow45', { delay: 100 })
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle2'}),
        ])
        console.log('browser logged in')

        await Promise.all([
            page.goto('https://beta.bidfta.com/dashboard?source=watchlist'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ])
        console.log('browser at user watchlist screen')

        const buffer = await page.screenshot({ fullPage: true })
        console.log('browser took screenshot')
        res.status(200).type('image/png').send(buffer)

    } catch (e) {
        res.status(500).send(e.toString())
    } finally {
        await browser.close()
        console.log('browser closed')
    }
})

puppeteeringApp.get('/beta-cookies', (req, res) => {
    executeBeta(testUser, testPass, (page) => {
        const cookies = page.cookies()
        res.status(200).send(JSON.stringify(cookies))
    })
})

exports.puppeteering = functions.runWith(puppetOpts).https.onRequest(puppeteeringApp)

const executeBeta = async (user, pass, next) => {
    // const browser = await puppeteer.launch({ headless: false }) // for testing purposes only
    const browser = await puppeteer.launch()
    console.log('browser launched')
    try {

        const page = await browser.newPage()
        await page.goto(vars.urls.login.beta, waitUntilIdle)
        console.log('browser at new fta login screen')

        // login process
        await page.type('#username', user, { delay: 100 })
        await page.type('#password', pass, { delay: 100 })
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation(waitUntilIdle),
        ])
        if (page.url().indexOf(errorBadCredentials) > -1) {
            throw 'Bad credentials'
        }

        console.log('browser logged in')
        await next(page)

    } catch (e) {
        if (e instanceof TimeoutError) {
            throw e // todo handle timeout error
        } else throw e
    } finally {
        await browser.close()
        console.log('browser closed')
    }
}