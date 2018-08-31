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
    console.log(req.body)

    const url = 'http://bidfta.bidqt.com/BidFTA/services/invoices/WlAuctions/filter?page=1&size=250&sort=endDateTime%20asc'

    const data = {
        q: 'showTimeRemaining=0 AND lower(ftalocationName) like lower(\'Newport, KY%\')'
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

    const callback = function(data) {
        data.forEach(a => console.log(a))
        // data.forEach(a => this.auctions.push(a))
    }

    fetch(url, params).then(response => response.json())
        .then(result => console.log('success:', result))
        .catch(error => console.log('error:', error));

    res.end()
})

app.listen(3000)