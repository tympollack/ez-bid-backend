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
                    id: {
                        name: {
                            format: String,
                            default: 'auctionId'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{auctionId}'
                        }
                    },

                    title: {
                        name: {
                            format: String,
                            default: 'title'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{title}'
                        }
                    },

                    name: {
                        name: {
                            format: String,
                            default: 'name'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{name}'
                        }
                    },

                    endDate: {
                        name: {
                            format: String,
                            default: 'endDate'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{endDate}'
                        }
                    },

                    removal: {
                        name: {
                            format: String,
                            default: 'removal'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{removal}'
                        }
                    },

                    locationAddress: {
                        name: {
                            format: String,
                            default: 'locationAddress'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{locationAddress}'
                        }
                    },

                    addDate: {
                        name: {
                            format: String,
                            default: 'addDate'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{addDate}'
                        }
                    },

                    sanitized: {
                        name: {
                            format: String,
                            default: 'sanitized'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{sanitized}'
                        }
                    },

                    itemsCrawled: {
                        name: {
                            format: String,
                            default: 'itemsCrawled'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{itemsCrawled}'
                        }
                    },

                    itemList: {
                        name: {
                            format: String,
                            default: 'itemList'
                        },
                        path: {
                            format: String,
                            default: 'auctions/{itemList}'
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
                default: 60
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
                title: {
                    format: String,
                    default: '#content-holder > div:nth-child(1) > nav > ol > li.breadcrumb-item.active'
                },

                name: {
                    format: String,
                    default: '#content-holder > div.container-fluid.padd-0 > div.detail-box > div.col-lg-9.col-md-8.col-sm-7.right-box > h1:nth-child(2)'
                },

                endDate: {
                    format: String,
                    default: '#content-holder > div.container-fluid.padd-0 > div.detail-box > div.col-lg-3.col-md-4.col-sm-5.col-xs-12.left-box > div > div.relative > aside:nth-child(5) > p:nth-child(3)'
                },

                locationAddress: {
                    format: String,
                    default: '#content-holder > div.container-fluid.padd-0 > div.detail-box > div.col-lg-3.col-md-4.col-sm-5.col-xs-12.left-box > div > div.relative > aside:nth-child(6) > p:nth-child(3)'
                },

                removal: {
                    format: String,
                    default: '#content-holder > div.container-fluid.padd-0 > div.detail-box > div.col-lg-9.col-md-8.col-sm-7.right-box > p:nth-child(10)'
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
            default: 'https://www.bidfta.com/placeMaxBidAuctionItems'
        }
    }
}