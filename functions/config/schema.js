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
                        doc: 'Name of the auction, combination of location abbrev and idk what number. (ex TK421)',
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

            items: {
                name: {
                    format: String,
                    default: 'items'
                },

                fields: {
                    id: {
                        name: {
                            format: String,
                            default: 'itemId'
                        },
                        path: {
                            format: String,
                            default: 'items/{itemId}'
                        }
                    },
                }
            },

            locations: {
                name: {
                    format: String,
                    default: 'locations'
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

                fields: {
                    id: {
                        name: {
                            format: String,
                            default: 'userId'
                        },
                        path: {
                            format: String,
                            default: 'users/{userId}'
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

                    session: {
                        name: {
                            format: String,
                            default: 'session'
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

                types: {
                    badAuctionNum: {
                        format: String,
                        default: 'BAD_AUCTION_NUM'
                    }
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
        findAuctionsAmount: {
            format: Number,
            default: 20
        },

        topics: {
            findNewAuctions: {
                doc: 'Topic added to by cron -> app engine.',
                format: String,
                default: 'find-new-auctions'
            },

            loginqueue: {
                doc: 'Topic added to by user needing a new session.',
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

            auction: {
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