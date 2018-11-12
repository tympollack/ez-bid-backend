exports.firestore = {
    collections: {
        auctions: {
            name: 'auctions',
            fields: {
                id: {
                    name: 'auctionId',
                    path: 'auctions/{auctionId}'
                }
            }
        },
        
        items: {
            name: 'items',
            fields: {
                id: {
                    name: 'itemId',
                    path: 'items/{itemId}'
                }
            }
        },
        
        locations: {
            name: 'locations',
            fields: {
                id: {
                    name: 'locationId',
                    path: 'locations/{locationId}'
                }
            }
        },
        
        users: {
            name: 'users',
            fields: {
                id: {
                    name: 'userId',
                    path: 'users/{userId}'
                }
            },
        },
    }
}

exports.urls = {
    login: {
        beta: 'https://beta.bidfta.com/login'
    }
}