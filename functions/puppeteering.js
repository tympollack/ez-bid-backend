const express = require('express')
const functions = require('firebase-functions')
const puppeteer = require('puppeteer')
const puppetOpts = {memory: '2GB', timeoutSeconds: 60}

const puppeteeringApp = express()

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

puppeteeringApp.get('/:auctionUrl', async (req, res) => {
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
    try {

        const page = await browser.newPage()

        await Promise.all([
            page.goto('https://beta.bidfta.com/login'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ])

        // login process
        await page.type('#username', '5195', { delay: 100 })
        await page.type('#password', 'Neocow45', { delay: 100 })
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle2'})
        ])

        await Promise.all([
            page.goto('https://beta.bidfta.com/dashboard?source=watchlist'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ])

        const buffer = await page.screenshot({ fullPage: true })
        res.status(200).type('image/png').send(buffer)

    } catch (e) {
        res.status(500).send(e.toString())
    } finally {
        await browser.close()
    }
})

exports.puppeteering = functions.runWith(puppetOpts).https.onRequest(puppeteeringApp)