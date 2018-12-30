module.exports = {
    env: {
        doc: 'The application environment.',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV'
    },

    firebase: {
        projectId: {
            doc: 'ID of the project.',
            format: String,
            default: ''
        },

        cloudResourceLocation: {
            doc: 'gcloud resource location.',
            format: String,
            default: ''
        }
    },

    url: {
        base: {
            doc: 'Base URL for HATEOAS.',
            format: 'url',
            default: ''
        },

        apiPath: {
            doc: 'Future-proofing.',
            format: String,
            default: '/api'
        },
    },

    httpResponses: {
        badCredentials: {
            format: 'errorType',
            default: {
                clean: 'Bad credentials',
                dirty: 'error=Bad%20credentials',
                status: 412
            }
        },

        failedDependency: {
            format: 'errorType',
            default: {
                clean: 'Failed dependency',
                status: 424
            }
        },

        internalServerError: {
            format: 'errorType',
            default: {
                clean: 'Internal server error',
                status: 500,
            }
        },

        networkAuthenticationRequired: {
            format: 'errorType',
            default: {
                clean: 'Awaiting BidFTA credentials. Please wait a few seconds before trying again.',
                status: 511,
            }
        },

        timeout: {
            format: 'errorType',
            default: {
                clean: 'Timeout',
            }
        },

        missingInformation: {
            format: 'errorType',
            default: {
                clean: 'Request missing required information.',
                status: 400,
            }
        },

        noUserId: {
            format: 'errorType',
            default: {
                clean: 'No user id supplied.',
                status: 400,
            }
        },

        notFound: {
            format: 'errorType',
            default: {
                clean: 'Not found.',
                status: 404,
            }
        },
    },

    datastore: {
        buckets: {
            productPictures: {
                name: {
                    format: 'guid',
                    default: ''
                },

                thumbPrefix: {
                    format: String,
                    default: 'thumb@'
                }
            }
        }
    },

    firestore: {
        collections: {
            auctions: {
                name: {
                    format: String,
                    default: 'auctions'
                },

                id: {
                    name: {
                        format: String,
                        default: 'id'
                    },
                    path: {
                        format: String,
                        default: 'auctions/{id}'
                    }
                },

                fields: {
                    addDate: {
                        doc: 'Date crawled.',
                        name: {
                            format: String,
                            default: 'addDate'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{addDate}'
                        }
                    },

                    auctionNumber: {
                        doc: 'BidFTA auction id. idk if this will ever change or if they will delete old numbers and reuse ids.',
                        name: {
                            format: String,
                            default: 'auctionNumber'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{auctionNumber}'
                        }
                    },

                    endDate: {
                        doc: 'Auction end date.',
                        name: {
                            format: String,
                            default: 'endDate'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{endDate}'
                        }
                    },

                    itemList: {
                        doc: 'Item numbers listed in auction.',
                        name: {
                            format: String,
                            default: 'itemList'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{itemList}'
                        }
                    },

                    itemsCrawled: {
                        doc: 'Whether items have been crawled for info.',
                        name: {
                            format: String,
                            default: 'itemsCrawled'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{itemsCrawled}'
                        }
                    },

                    locationAddress: {
                        doc: 'Location address of auction. Eventually want reference to location in firestore',
                        name: {
                            format: String,
                            default: 'locationAddress'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{locationAddress}'
                        }
                    },

                    name: {
                        doc: 'Name of the auction, combination of location abbrev and idk what number. (ex THX1138)',
                        name: {
                            format: String,
                            default: 'name'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{name}'
                        }
                    },

                    numItems: {
                        doc: 'Number of items in auction; helpful for determining item urls for later crawl.',
                        name: {
                            format: String,
                            default: 'numItems'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{numItems}'
                        }
                    },

                    removal: {
                        doc: 'Dates/times of pickup availability.',
                        name: {
                            format: String,
                            default: 'removal'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{removal}'
                        }
                    },

                    sanitized: {
                        doc: 'Whether additional sanitization has occurred.',
                        name: {
                            format: String,
                            default: 'sanitized'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{sanitized}'
                        }
                    },

                    title: {
                        doc: 'Auction title.',
                        name: {
                            format: String,
                            default: 'title'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{title}'
                        }
                    },
                }
            },

            bids: {
                name: {
                    format: String,
                    default: 'bids'
                },

                id: {
                    name: {
                        format: String,
                        default: 'id'
                    },
                    path: {
                        format: String,
                        default: 'bids/{id}'
                    }
                },

                fields: {
                    amount: {
                        name: {
                            format: String,
                            default: 'amount'
                        },
                        path: {
                            format: String,
                            default: 'bids/{amount}'
                        }
                    },

                    auctionId: {
                        name: {
                            format: String,
                            default: 'auctionId'
                        },
                        path: {
                            format: String,
                            default: 'bids/{auctionId}'
                        }
                    },

                    bidderId: {
                        name: {
                            format: String,
                            default: 'bidderId'
                        },
                        path: {
                            format: String,
                            default: 'bids/{bidderId}'
                        }
                    },

                    date: {
                        name: {
                            format: String,
                            default: 'date'
                        },
                        path: {
                            format: String,
                            default: 'bids/{date}'
                        }
                    },

                    itemId: {
                        name: {
                            format: String,
                            default: 'itemId'
                        },
                        path: {
                            format: String,
                            default: 'bids/{itemId}'
                        }
                    },
                },
            },

            items: {
                name: {
                    format: String,
                    default: 'items'
                },

                id: {
                    name: {
                        format: String,
                        default: 'id'
                    },
                    path: {
                        format: String,
                        default: 'items/{id}'
                    }
                },

                fields: {
                    id: {
                        name: {
                            format: String,
                            default: 'id'
                        },
                        path: {
                            format: String,
                            default: 'items/{id}'
                        }
                    },

                    addDate: {
                        name: {
                            doc: 'Auction ID.',
                            format: String,
                            default: 'addDate'
                        },
                        path: {
                            format: String,
                            default: 'items/{addDate}'
                        }
                    },

                    auctionId: {
                        name: {
                            doc: 'Auction ID.',
                            format: String,
                            default: 'auctionId'
                        },
                        path: {
                            format: String,
                            default: 'items/{auctionId}'
                        }
                    },

                    auctionNumber: {
                        name: {
                            doc: 'BidFTA auction number.',
                            format: String,
                            default: 'auctionNumber'
                        },
                        path: {
                            format: String,
                            default: 'items/{auctionNumber}'
                        }
                    },

                    bids: {
                        name: {
                            doc: 'Bid list.',
                            format: String,
                            default: 'bids'
                        },
                        path: {
                            format: String,
                            default: 'items/{bids}'
                        }
                    },

                    brandName: {
                        name: {
                            doc: 'Brand name.',
                            format: String,
                            default: 'brandName'
                        },
                        path: {
                            format: String,
                            default: 'items/{brandName}'
                        }
                    },

                    currentBid: {
                        name: {
                            doc: 'Current bid amount.',
                            format: String,
                            default: 'currentBid'
                        },
                        path: {
                            format: String,
                            default: 'items/{currentBid}'
                        }
                    },

                    currentBidder: {
                        name: {
                            doc: 'Current winning bidder.',
                            format: String,
                            default: 'currentBidder'
                        },
                        path: {
                            format: String,
                            default: 'items/{currentBidder}'
                        }
                    },

                    desc: {
                        name: {
                            doc: 'Detailed item description.',
                            format: String,
                            default: 'desc'
                        },
                        path: {
                            format: String,
                            default: 'items/{desc}'
                        }
                    },

                    endDate: {
                        name: {
                            doc: 'Specific end time of item. Bids within 3 minutes of end time extend time by 3 minutes.',
                            format: String,
                            default: 'endDate'
                        },
                        path: {
                            format: String,
                            default: 'items/{endDate}'
                        }
                    },

                    itemNumber: {
                        name: {
                            doc: 'Item number. (ex TK421)',
                            format: String,
                            default: 'itemNumber'
                        },
                        path: {
                            format: String,
                            default: 'items/{itemNumber}'
                        }
                    },

                    listedMSRP: {
                        name: {
                            doc: 'MSRP according to BidFTA.',
                            format: String,
                            default: 'listedMSRP'
                        },
                        path: {
                            format: String,
                            default: 'items/{listedMSRP}'
                        }
                    },

                    location: {
                        name: {
                            doc: 'Item location.',
                            format: String,
                            default: 'location'
                        },
                        path: {
                            format: String,
                            default: 'items/{location}'
                        }
                    },

                    locationId: {
                        name: {
                            doc: 'Location ID in firestore.',
                            format: String,
                            default: 'locationId'
                        },
                        path: {
                            format: String,
                            default: 'items/{locationId}'
                        }
                    },

                    model: {
                        name: {
                            doc: 'Item model.',
                            format: String,
                            default: 'model'
                        },
                        path: {
                            format: String,
                            default: 'items/{model}'
                        }
                    },

                    nextBid: {
                        name: {
                            doc: 'Next bid amount.',
                            format: String,
                            default: 'nextBid'
                        },
                        path: {
                            format: String,
                            default: 'items/{nextBid}'
                        }
                    },

                    productImageLinks: {
                        name: {
                            doc: 'Links to bidfta aws images.',
                            format: String,
                            default: 'productImageLinks'
                        },
                        path: {
                            format: String,
                            default: 'items/{productImageLinks}'
                        }
                    },

                    specs: {
                        name: {
                            doc: 'Item specifications.',
                            format: String,
                            default: 'specs'
                        },
                        path: {
                            format: String,
                            default: 'items/{specs}'
                        }
                    },

                    status: {
                        name: {
                            doc: 'Item status! Brand new, appears new, open box, damaged, broken.',
                            format: String,
                            default: 'status'
                        },
                        path: {
                            format: String,
                            default: 'items/{status}'
                        }
                    },

                    statusAdditional: {
                        name: {
                            doc: 'Brand name.',
                            format: String,
                            default: 'statusAdditional'
                        },
                        path: {
                            format: String,
                            default: 'items/{statusAdditional}'
                        }
                    },

                    title: {
                        name: {
                            doc: 'Item title.',
                            format: String,
                            default: 'title'
                        },
                        path: {
                            format: String,
                            default: 'items/{title}'
                        }
                    },

                    updatedDate: {
                        name: {
                            doc: 'Auction ID.',
                            format: String,
                            default: 'updatedDate'
                        },
                        path: {
                            format: String,
                            default: 'items/{updatedDate}'
                        }
                    },
                }
            },

            locations: {
                name: {
                    format: String,
                    default: 'locations'
                },

                id: {
                    name: {
                        format: String,
                        default: 'id'
                    },
                    path: {
                        format: String,
                        default: 'locations/{id}'
                    }
                },

                fields: {
                    id: {
                        name: {
                            format: String,
                            default: 'locationId'
                        },
                        path: {
                            format: String,
                            default: 'locations/{locationId}'
                        }
                    },
                }
            },

            users: {
                name: {
                    format: String,
                    default: 'users'
                },

                id: {
                    name: {
                        format: String,
                        default: 'id'
                    },
                    path: {
                        format: String,
                        default: 'users/{id}'
                    }
                },

                fields: {
                    id: {
                        name: {
                            format: String,
                            default: 'id'
                        },
                        path: {
                            format: String,
                            default: 'users/{id}'
                        }
                    },

                    bidnum: {
                        name: {
                            doc: 'FTA bidder number.',
                            format: String,
                            default: 'bidnum'
                        },
                        path: {
                            format: String,
                            default: 'users/{bidnum}'
                        }
                    },

                    bidpw: {
                        name: {
                            format: String,
                            default: 'bidpw'
                        },
                        path: {
                            format: String,
                            default: 'users/{bidpw}'
                        }
                    },

                    bids: {
                        name: {
                            doc: 'FTA bidder number.',
                            format: String,
                            default: 'bids'
                        },
                        path: {
                            format: String,
                            default: 'users/{bids}'
                        },

                        fields: {
                            amount: {
                                name: {
                                    format: String,
                                    default: 'amount'
                                },
                            },

                            date: {
                                name: {
                                    format: String,
                                    default: 'date'
                                },
                            },

                            itemId: {
                                name: {
                                    format: String,
                                    default: 'itemId'
                                },
                            },
                        }
                    },

                    session: {
                        name: {
                            format: String,
                            default: 'session'
                        },
                        path: {
                            format: String,
                            default: 'users/{session}'
                        },

                        fields: {
                            cookie: {
                                name: {
                                    format: String,
                                    default: 'cookie'
                                },
                            },

                            csrf: {
                                name: {
                                    format: String,
                                    default: 'csrf'
                                },
                            },

                            expiration: {
                                name: {
                                    format: String,
                                    default: 'expiration'
                                },
                            },
                        }
                    },
                }
            },

            info: {
                name: {
                    format: String,
                    default: 'info'
                },

                fields: {
                    type: {
                        name: {
                            format: String,
                            default: 'type'
                        },
                        path: {
                            format: String,
                            default: 'info/{type}'
                        }
                    },

                    value: {
                        name: {
                            format: String,
                            default: 'value'
                        },
                        path: {
                            format: String,
                            default: 'info/{value}'
                        }
                    },
                },

                adminReport: {
                    firestoreObjectCounts: {
                        name: {
                            format: String,
                            default: 'firestoreObjectCounts'
                        },
                        auctions: {
                            format: String,
                            default: 'auctionCount'
                        },
                        bids: {
                            format: String,
                            default: 'bidCount'
                        },
                        items: {
                            format: String,
                            default: 'itemCount'
                        },
                        users: {
                            format: String,
                            default: 'userCount'
                        },
                    },

                    averageBid: {
                        format: String,
                        default: 'averageBid'
                    },

                    totalBidAmount: {
                        format: String,
                        default: 'totalBidAmount'
                    },

                    time: {
                        format: String,
                        default: 'time'
                    },
                },

                progModConfig: {
                    baseMinutesAgo: {
                        name: {
                            format: String,
                            default: 'baseMinutesAgo'
                        },
                        path: {
                            format: String,
                            default: 'info/{baseMinutesAgo}'
                        }
                    },
                },

                types: {
                    badAuctionNum: {
                        format: String,
                        default: 'BAD_AUCTION_NUM'
                    },

                    dailyAdminReport: {
                        format: String,
                        default: 'DAILY_ADMIN_REPORT'
                    },

                    auctionStats: {
                        format: String,
                        default: 'AUCTION_STATS'
                    },

                    bidStats: {
                        format: String,
                        default: 'BID_STATS'
                    },

                    itemStats: {
                        format: String,
                        default: 'ITEM_STATS'
                    },

                    locationStats: {
                        format: String,
                        default: 'LOCATION_STATS'
                    },

                    userStats: {
                        format: String,
                        default: 'USER_STATS'
                    },

                    progModConfig: {
                        format: String,
                        default: 'PROGRAMATICALLY_MODDED_CONFIG'
                    },
                }
            }
        },

        serviceAccount: {
            doc: 'Contains default creds for bid.',
            userId: {
                format: String,
                default: ''
            }
        }
    },

    pubsub: {
        baseMinutesAgo: {
            format: Number,
            default: 60,
        },

        findAuctionsAmount: {
            format: Number,
            default: 5
        },

        findItemsAmount: {
            format: Number,
            default: 1
        },

        maxItemsPerPage: {
            format: Number,
            default: 24
        },

        topics: {
            doc: 'Topics added to by cron -> app engine.',
            findNewAuctions: {
                format: String,
                default: 'find-new-auctions'
            },

            findNewItems: {
                format: String,
                default: 'find-new-items'
            },

            generateAdminReport: {
                format: String,
                default: 'generate-admin-report'
            },

            loginqueue: {
                format: String,
                default: 'loginqueue'
            }
        }
    },

    puppeteer: {
        opts: {
            memory: {
                format: String,
                default: '2GB'
            },

            timeoutSeconds: {
                format: Number,
                default: 120
            }
        },

        selectors: {
            meta: {
                csrf: {
                    format: String,
                    default: 'head > meta[name="_csrf"]'
                }
            },

            login: {
                username: {
                    format: String,
                    default: '#username'
                },

                password: {
                    format: String,
                    default: '#password'
                }
            },

            auctionDetails: {
                endDate: {
                    name: {
                        format: String,
                        default: 'endDate'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder div.detail-box > div.left-box > div > div.relative > aside:nth-child(5) > p:nth-child(3)'
                    }
                },

                locationAddress: {
                    name: {
                        format: String,
                        default: 'locationAddress'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder div.detail-box > div.left-box > div > div.relative > aside:nth-child(6) > p:nth-child(3)'
                    }
                },

                name: {
                    name: {
                        format: String,
                        default: 'name'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder div.detail-box > div.right-box > h1:nth-child(2)'
                    }
                },

                numItems: {
                    name: {
                        format: String,
                        default: 'numItems'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder div.detail-box > div.left-box > div > div.relative > div > a > div'
                    }
                },

                removal: {
                    name: {
                        format: String,
                        default: 'removal'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder div.detail-box > div.right-box > p:nth-child(10)'
                    }
                },

                title: {
                    name: {
                        format: String,
                        default: 'title'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div:nth-child(1) > nav > ol > li.breadcrumb-item.active'
                    }
                },
            },

            auctionItems: {
                itemIdDivList: {
                    name: {
                        format: String,
                        default: 'itemIdDivList'
                    },
                    selector: {
                        format: String,
                        default: '#grid-box div[id^="itemContainer"]'
                    }
                },

            },

            itemDetails: {
                auctionNumber: {
                    name: {
                        format: String,
                        default: 'auctionNumber'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Auction Number"]'
                    }
                },

                bidListButton: {
                    name: {
                        format: String,
                        default: 'bidListButton'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.client-bid-box.bidEnableList.dropdown-toggle'
                    }
                },

                bidListTable: {
                    name: {
                        format: String,
                        default: 'bidListTable'
                    },
                    selector: {
                        format: String,
                        default: '#bidTbl_'
                    }
                },

                brandName: {
                    name: {
                        format: String,
                        default: 'brandName'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Brand name of item"]'
                    }
                },

                currentBid: {
                    name: {
                        format: String,
                        default: 'currentBid'
                    },
                    selector: {
                        format: String,
                        default: '#currentBid'
                    }
                },

                desc: {
                    name: {
                        format: String,
                        default: 'desc'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > span.moreDescription'
                    }
                },

                endDate: {
                    name: {
                        format: String,
                        default: 'endDate'
                    },
                    selector: {
                        format: String,
                        default: '#itemtime'
                    }
                },

                endDate2: {
                    name: {
                        format: String,
                        default: 'endDate2'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder div.auctionInfo > p.discription'
                    }
                },

                itemNumber: {
                    name: {
                        format: String,
                        default: 'itemNumber'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder .brandCode'
                    }
                },

                listedMSRP: {
                    name: {
                        format: String,
                        default: 'listedMSRP'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Maximum selling retail price of item"]'
                    }
                },

                location: {
                    name: {
                        format: String,
                        default: 'location'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Pickup Location"]'
                    }
                },

                model: {
                    name: {
                        format: String,
                        default: 'model'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Item model number"]'
                    }
                },

                nextBid: {
                    name: {
                        format: String,
                        default: 'nextBid'
                    },
                    selector: {
                        format: String,
                        default: '#nextBid'
                    }
                },

                productLinkList: {
                    name: {
                        format: String,
                        default: 'productLinkList'
                    },
                    selector: {
                        format: String,
                        default: '#demo4carousel'
                    }
                },

                specs: {
                    name: {
                        format: String,
                        default: 'specs'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Item specification in detail"]'
                    }
                },

                status: {
                    name: {
                        format: String,
                        default: 'status'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block span.itemStatus'
                    }
                },

                statusAdditional: {
                    name: {
                        format: String,
                        default: 'statusAdditional'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Additional information of item condition"]'
                    }
                },

                title: {
                    name: {
                        format: String,
                        default: 'title'
                    },
                    selector: {
                        format: String,
                        default: '#content-holder > div.product-detail-holder > div.itemDetail-Block div.right-box > div > strong[data-original-title="Title"]'
                    }
                },
            }
        },

        cookies: {
            awsalb: {
                format: String,
                default: 'AWSALB'
            },

            jsessionId: {
                format: String,
                default: 'JSESSIONID'
            },
        }
    },

    bidApiUrls: {
        login: {
            format: 'url',
            default: 'https://www.bidfta.com/login'
        },
        watchlist: {
            format: 'url',
            default: 'https://www.bidfta.com/dashboard?source=watchlist'
        },
        auctionDetails: {
            url: {
                format: 'url',
                default: 'https://www.bidfta.com/auctionDetails'
            },
            params: {
                auctionId: {
                    format: String,
                    default: 'idauctions'
                }
            }
        },
        auctionItems: {
            url: {
                format: 'url',
                default: 'https://www.bidfta.com/auctionItems'
            },
            params: {
                auctionId: {
                    format: String,
                    default: 'idauctions'
                },
                pageId: {
                    format: String,
                    default: 'pageId'
                }
            }
        },
        itemDetails: {
            url: {
                format: 'url',
                default: 'https://www.bidfta.com/itemDetails'
            },
            params: {
                auctionId: {
                    format: String,
                    default: 'idauctions'
                },
                itemId: {
                    format: String,
                    default: 'idItems'
                },
                source: {
                    name: {
                        format: String,
                        default: 'source'
                    },
                    value: {
                        format: String,
                        default: 'auctionItems'
                    }
                }

            }
        },


        deleteItemFromWatchlist: {
            format: 'url',
            default: 'https://www.bidfta.com/deleteItemFromWatchlist'
        },
        saveItemToWatchlist: {
            format: 'url',
            default: 'https://www.bidfta.com/saveItemToWatchlist'
        },
        placeAjaxBid: {
            format: 'url',
            default: 'https://www.bidfta.com/bidfta/bidAuctionItems'
        }
        ,
        placeAjaxMaxBid: {
            format: 'url',
            default: 'https://www.bidfta.com/bidfta/placeMaxBidAuctionItems'
        },
        getBidHistoryList: {
            format: 'url',
            default: 'https://www.bidfta.com/getBidHistoryListItem'
        }
    }
}