module.exports = {
    env: {
        doc: 'The application environment.',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV'
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

    errors: {
        badCredentials: {
            format: 'errorType',
            default: {
                clean: 'Bad credentials',
                dirty: 'error=Bad%20credentials',
            }
        },

        internalServerError: {
            format: 'errorType',
            default: {
                clean: 'Internal server error',
                status: 500,
            }
        },

        timeout: {
            format: 'errorType',
            default: {
                clean: 'Timeout',
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

            getNewUserSession: {
                doc: 'Topic added to by user needing a new session.',
                format: String,
                default: 'get-new-user-session'
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
        }
    },

    urls: {
        login: {
            format: 'url',
            default: 'https://www.bidfta.com/login'
        },
        deleteItemFromWatchlist: {
            format: 'url',
            default: 'https://www.bidfta.com/deleteItemFromWatchlist'
        },
        saveItemToWatchlist: {
            format: 'url',
            default: 'https://www.bidfta.com/saveItemToWatchlist'
        },
        watchlist: {
            format: 'url',
            default: 'https://www.bidfta.com/dashboard?source=watchlist'
        }
    }
}