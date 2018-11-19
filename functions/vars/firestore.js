exports.collections = {
    auctions: {
        name: 'auctions',
        fields: {
            id: {
                name: 'auctionId',
                path: 'auctions/{auctionId}'
            },
            itemList: {
                name: 'itemList',
                path: 'auctions/itemList'
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
            },
            session: {
                name: 'session',
                fields: {
                    cookie: {
                        name: 'cookie',
                    },
                    csrf: {
                        name: 'csrf',
                    },
                    expiration: {
                        name: 'expiration',
                    }
                }
            },
        },
    },
}