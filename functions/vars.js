const config = require('./config/config').get()

exports.CONFIG_BID_API_URLS = config.bidApiUrls

exports.BID_AUCTION_DETAILS_BASE = this.CONFIG_BID_API_URLS.auctionDetails
exports.BID_AUCTION_DETAILS_URL = this.BID_AUCTION_DETAILS_BASE.url
exports.BID_AUCTION_DETAILS_PARAMS = this.BID_AUCTION_DETAILS_BASE.params
exports.BID_AUCTION_DETAILS_PARAMS_AUCTIONID = this.BID_AUCTION_DETAILS_PARAMS.auctionId

exports.BID_AUCTION_ITEMS_BASE = this.CONFIG_BID_API_URLS.auctionItems
exports.BID_AUCTION_ITEMS_URL = this.BID_AUCTION_ITEMS_BASE.url
exports.BID_AUCTION_ITEMS_PARAMS = this.BID_AUCTION_ITEMS_BASE.params
exports.BID_AUCTION_ITEMS_PARAMS_AUCTIONID = this.BID_AUCTION_ITEMS_PARAMS.auctionId
exports.BID_AUCTION_ITEMS_PARAMS_PAGEID = this.BID_AUCTION_ITEMS_PARAMS.pageId

exports.BID_ITEM_DETAILS_BASE = this.CONFIG_BID_API_URLS.itemDetails
exports.BID_ITEM_DETAILS_URL = this.BID_ITEM_DETAILS_BASE.url
exports.BID_ITEM_DETAILS_PARAMS = this.BID_ITEM_DETAILS_BASE.params
exports.BID_ITEM_DETAILS_PARAMS_AUCTIONID = this.BID_ITEM_DETAILS_PARAMS.auctionId
exports.BID_ITEM_DETAILS_PARAMS_ITEMID = this.BID_ITEM_DETAILS_PARAMS.itemId
exports.BID_ITEM_DETAILS_PARAMS_SOURCE = this.BID_ITEM_DETAILS_PARAMS.source.name
exports.BID_ITEM_DETAILS_PARAMS_SOURCE_VAL = this.BID_ITEM_DETAILS_PARAMS.source.value

/////////////////////////////////////////////////////////////////////

exports.CONFIG_FIREBASE = config.firebase

exports.FB_PROJECTID = this.CONFIG_FIREBASE.projectId
exports.FB_CLOUD_RESOURCE_LOCATION = this.CONFIG_FIREBASE.cloudResourceLocation

/////////////////////////////////////////////////////////////////////

exports.CONFIG_FIRESTORE = config.firestore

exports.FS_SERVICE_ACCOUNT = this.CONFIG_FIRESTORE.serviceAccount
exports.FS_SERVICE_ACCOUNT_ID = this.FS_SERVICE_ACCOUNT.userId

exports.FS_COLLECTIONS = this.CONFIG_FIRESTORE.collections
exports.FS_COLLECTIONS_AUCTIONS = this.FS_COLLECTIONS.auctions
exports.FS_COLLECTIONS_BIDS = this.FS_COLLECTIONS.bids
exports.FS_COLLECTIONS_INFO = this.FS_COLLECTIONS.info
exports.FS_COLLECTIONS_ITEMS = this.FS_COLLECTIONS.items
exports.FS_COLLECTIONS_USERS = this.FS_COLLECTIONS.users

exports.FS_FIELDS_AUCTION = this.FS_COLLECTIONS_AUCTIONS.fields
exports.FS_FIELDS_BID = this.FS_COLLECTIONS_BIDS.fields
exports.FS_FIELDS_INFO = this.FS_COLLECTIONS_INFO.fields
exports.FS_FIELDS_ITEM = this.FS_COLLECTIONS_ITEMS.fields
exports.FS_FIELDS_USER = this.FS_COLLECTIONS_USERS.fields
exports.FS_FIELDS_USER_SESSION = this.FS_FIELDS_USER.session.fields

exports.FS_AUCTION_ADD_DATE = this.FS_FIELDS_AUCTION.addDate.name
exports.FS_AUCTION_AUCTION_NUMBER = this.FS_FIELDS_AUCTION.auctionNumber.name
exports.FS_AUCTION_END_DATE = this.FS_FIELDS_AUCTION.endDate.name
exports.FS_AUCTION_ITEM_LIST = this.FS_FIELDS_AUCTION.itemList.name
exports.FS_AUCTION_ITEMS_CRAWLED = this.FS_FIELDS_AUCTION.itemsCrawled.name
exports.FS_AUCTION_LOCATION_ADDRESS = this.FS_FIELDS_AUCTION.locationAddress.name
exports.FS_AUCTION_NAME = this.FS_FIELDS_AUCTION.name.name
exports.FS_AUCTION_NUM_ITEMS = this.FS_FIELDS_AUCTION.numItems.name
exports.FS_AUCTION_REMOVAL = this.FS_FIELDS_AUCTION.removal.name
exports.FS_AUCTION_SANITIZED = this.FS_FIELDS_AUCTION.sanitized.name
exports.FS_AUCTION_TITLE = this.FS_FIELDS_AUCTION.title.name

exports.FS_BID_AMOUNT = this.FS_FIELDS_BID.amount.name
exports.FS_BID_AUCTION_ID = this.FS_FIELDS_BID.auctionId.name
exports.FS_BID_BIDDER_ID = this.FS_FIELDS_BID.bidderId.name
exports.FS_BID_DATE = this.FS_FIELDS_BID.date.name
exports.FS_BID_ITEM_ID = this.FS_FIELDS_BID.itemId.name

exports.FS_INFO_FIRESTORE_OBJECT_COUNTS = this.FS_FIELDS_INFO.firestoreObjectCounts.name
exports.FS_INFO_TIME = this.FS_FIELDS_INFO.time.name
exports.FS_INFO_TYPE = this.FS_FIELDS_INFO.type.name
exports.FS_INFO_VALUE = this.FS_FIELDS_INFO.value.name
exports.FS_INFO_TYPES = this.FS_COLLECTIONS_INFO.types
exports.FS_INFO_PROG_MOD_CONFIG = this.FS_COLLECTIONS_INFO.progModConfig

exports.FS_PMC_MINUTES_AGO = this.FS_INFO_PROG_MOD_CONFIG.baseMinutesAgo.name

exports.FS_ITEM_ADD_DATE = this.FS_FIELDS_ITEM.addDate.name
exports.FS_ITEM_AUCTION_ID = this.FS_FIELDS_ITEM.auctionId.name
exports.FS_ITEM_AUCTION_NUMBER = this.FS_FIELDS_ITEM.auctionNumber.name
exports.FS_ITEM_BIDS = this.FS_FIELDS_ITEM.bids.name
exports.FS_ITEM_BRAND_NAME = this.FS_FIELDS_ITEM.brandName.name
exports.FS_ITEM_CURRENT_BID = this.FS_FIELDS_ITEM.currentBid.name
exports.FS_ITEM_CURRENT_BIDDER = this.FS_FIELDS_ITEM.currentBidder.name
exports.FS_ITEM_DESC = this.FS_FIELDS_ITEM.desc.name
exports.FS_ITEM_END_DATE = this.FS_FIELDS_ITEM.endDate.name
exports.FS_ITEM_ID = this.FS_FIELDS_ITEM.id.name
exports.FS_ITEM_ITEM_NUMBER = this.FS_FIELDS_ITEM.itemNumber.name
exports.FS_ITEM_LISTED_MSRP = this.FS_FIELDS_ITEM.listedMSRP.name
exports.FS_ITEM_LOCATION = this.FS_FIELDS_ITEM.location.name
exports.FS_ITEM_LOCATION_ID = this.FS_FIELDS_ITEM.locationId.name
exports.FS_ITEM_MODEL = this.FS_FIELDS_ITEM.model.name
exports.FS_ITEM_NEXT_BID = this.FS_FIELDS_ITEM.nextBid.name
exports.FS_ITEM_PRODUCT_IMAGE_LINKS = this.FS_FIELDS_ITEM.productImageLinks.name
exports.FS_ITEM_SPECS = this.FS_FIELDS_ITEM.specs.name
exports.FS_ITEM_STATUS = this.FS_FIELDS_ITEM.status.name
exports.FS_ITEM_STATUS_ADDITIONAL = this.FS_FIELDS_ITEM.statusAdditional.name
exports.FS_ITEM_TITLE = this.FS_FIELDS_ITEM.title.name
exports.FS_ITEM_UPDATED_DATE = this.FS_FIELDS_ITEM.updatedDate.name

exports.FS_USER_BIDNUM = this.FS_FIELDS_USER.bidnum.name
exports.FS_USER_BIDPW = this.FS_FIELDS_USER.bidpw.name
exports.FS_USER_SESSION = this.FS_FIELDS_USER.session.name
exports.FS_USER_BIDS = this.FS_FIELDS_USER.bids.name
exports.FS_USER_BIDS_AMOUNT = this.FS_FIELDS_USER.bids.fields.amount.name
exports.FS_USER_BIDS_DATE = this.FS_FIELDS_USER.bids.fields.date.name
exports.FS_USER_BIDS_ITEM_ID = this.FS_FIELDS_USER.bids.fields.itemId.name

exports.FS_SESSION_COOKIE = this.FS_FIELDS_USER_SESSION.cookie.name
exports.FS_SESSION_CSRF = this.FS_FIELDS_USER_SESSION.csrf.name
exports.FS_SESSION_EXPIRATION = this.FS_FIELDS_USER_SESSION.expiration.name

/////////////////////////////////////////////////////////////////////

exports.CONFIG_PUBSUB = config.pubsub

exports.PS_BASE_MINUTES_AGO = this.CONFIG_PUBSUB.baseMinutesAgo
exports.PS_FIND_AUCTIONS_AMOUNT = this.CONFIG_PUBSUB.findAuctionsAmount
exports.PS_FIND_ITEMS_AMOUNT = this.CONFIG_PUBSUB.findItemsAmount
exports.PS_MAX_ITEMS_PER_PAGE = this.CONFIG_PUBSUB.maxItemsPerPage
exports.PS_TOPICS = this.CONFIG_PUBSUB.topics

/////////////////////////////////////////////////////////////////////

exports.CONFIG_PUPPETEER = config.puppeteer
exports.PUPPETEER_OPTS = this.CONFIG_PUPPETEER.opts

exports.PUP_SELECTORS = this.CONFIG_PUPPETEER.selectors
exports.PUP_SELECTORS_AUCTION_DETAILS = this.PUP_SELECTORS.auctionDetails
exports.PUP_SELECTORS_AUCTION_ITEMS = this.PUP_SELECTORS.auctionItems
exports.PUP_SELECTORS_ITEM_DETAILS = this.PUP_SELECTORS.itemDetails
exports.PUP_SELECTORS_LOGIN = this.PUP_SELECTORS.login
exports.PUP_SELECTORS_META = this.PUP_SELECTORS.meta

exports.PUP_SEL_AUCTION_ITEMS_ITEM_DIV_LIST = this.PUP_SELECTORS_AUCTION_ITEMS.itemIdDivList

exports.PUP_SEL_ITEM_DETAILS_AUCTION_NUMBER = this.PUP_SELECTORS_ITEM_DETAILS.auctionNumber
exports.PUP_SEL_ITEM_DETAILS_BID_LIST_BUTTON = this.PUP_SELECTORS_ITEM_DETAILS.bidListButton
exports.PUP_SEL_ITEM_DETAILS_BID_LIST_TABLE = this.PUP_SELECTORS_ITEM_DETAILS.bidListTable
exports.PUP_SEL_ITEM_DETAILS_BRAND_NAME = this.PUP_SELECTORS_ITEM_DETAILS.brandName
exports.PUP_SEL_ITEM_DETAILS_CURRENT_BID = this.PUP_SELECTORS_ITEM_DETAILS.currentBid
exports.PUP_SEL_ITEM_DETAILS_DESC = this.PUP_SELECTORS_ITEM_DETAILS.desc
exports.PUP_SEL_ITEM_DETAILS_END_DATE = this.PUP_SELECTORS_ITEM_DETAILS.endDate
exports.PUP_SEL_ITEM_DETAILS_END_DATE2 = this.PUP_SELECTORS_ITEM_DETAILS.endDate2
exports.PUP_SEL_ITEM_DETAILS_ITEM_NUMBER = this.PUP_SELECTORS_ITEM_DETAILS.itemNumber
exports.PUP_SEL_ITEM_DETAILS_LISTED_MSRP = this.PUP_SELECTORS_ITEM_DETAILS.listedMSRP
exports.PUP_SEL_ITEM_DETAILS_LOCATION = this.PUP_SELECTORS_ITEM_DETAILS.location
exports.PUP_SEL_ITEM_DETAILS_MODEL = this.PUP_SELECTORS_ITEM_DETAILS.model
exports.PUP_SEL_ITEM_DETAILS_NEXT_BID = this.PUP_SELECTORS_ITEM_DETAILS.nextBid
exports.PUP_SEL_ITEM_DETAILS_PRODUCT_LINK_LIST = this.PUP_SELECTORS_ITEM_DETAILS.productLinkList
exports.PUP_SEL_ITEM_DETAILS_SPECS = this.PUP_SELECTORS_ITEM_DETAILS.specs
exports.PUP_SEL_ITEM_DETAILS_STATUS = this.PUP_SELECTORS_ITEM_DETAILS.status
exports.PUP_SEL_ITEM_DETAILS_STATUS_ADDITIONAL = this.PUP_SELECTORS_ITEM_DETAILS.statusAdditional
exports.PUP_SEL_ITEM_DETAILS_TITLE = this.PUP_SELECTORS_ITEM_DETAILS.title