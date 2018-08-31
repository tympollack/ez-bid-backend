getAuctionList () {
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
        data.forEach(a => this.auctions.push(a))
    }

    fetch(url, params).then(r => r.json().then(callback))
},

load: function(loader, method) {
    loader = true
    method().then(loader = false)
}