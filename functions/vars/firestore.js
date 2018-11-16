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

    sessions: {
        name: 'sessions',
        fields: {
            cookie: {
                name: 'cookie',
                path: 'sessions/{cookie}'
            },
            csrf: {
                name: 'csrf',
                path: 'sessions/{csrf}'
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