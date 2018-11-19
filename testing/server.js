const app = require('express')()
const bodyParser = require('body-parser')
const fetch = require('node-fetch')

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next();
})

app.get('/getAuctionList', function (req, res) {
    console.log('/getAuctionList', req.body)

    const url = 'http://bidfta.bidqt.com/BidFTA/services/invoices/WlAuctions/filter?page=1&size=250&sort=endDateTime%20asc'

    const data = {
        q: 'showTimeRemaining=0'
    }

    const params = {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        redirect: 'follow',
        referrer: 'no-referrer',
        body: JSON.stringify(data)
    }

    fetch(url, params).then(response => response.json())
        .then(d => res.status(200).send(d))
        .catch(error => console.log('error:', error));
})

app.get('/addToFirestore', (req, res) => {
    console.log('/addToFirestore', req.body)

    const url = 'https://firestore.googleapis.com/v1beta1/projects/ezbidfta867/databases/(default)/documents/auctions'
    const data = {
        name: 'projects/ezbidfta/databases/ezbidfta867/documents/auctions/testAuc',
        fields: {
            auction: 'auc1',
            test: 'poop'
        }
    }
    const params = {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        redirect: 'follow',
        referrer: 'no-referrer',
        body: JSON.stringify(data)
    }

    // fetch(url, params).then(response => response.json())
    //     .then(d => res.status(200).send(d))
    //     .catch(error => console.log('error:', error))

    fetch(url, params).then(response => res.status(200).send(response))
})

app.get('/getAuctionFromFirestore', (req, res) => {
    console.log('/getAuctionFromFirestore', req.body)

    const url = 'https://firestore.googleapis.com/v1beta1/projects/ezbidfta867/databases/(default)/documents/auctions/FGMERJhph1thuJteidDy'
    const params = {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        redirect: 'follow',
        referrer: 'no-referrer',
    }

    fetch(url, params).then(response => response.json())
        .then(d => res.status(200).send(d))
        .catch(error => console.log('error:', error))
    //
    // fetch(url, params).then(response => res.status(200).send(response))
})

app.listen(3000)