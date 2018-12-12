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

                    itemList: {
                        name: {
                            format: String,
                            default: 'itemList'
                        },
                        path: {
                            format: String,
                            default: 'auctions/itemList'
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