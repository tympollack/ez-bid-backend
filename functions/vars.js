const config = require('./config/config').get()

exports.CONFIG_BID_API_URLS = config.bidApiUrls

exports.BID_AUCTION_DETAILS_BASE = this.CONFIG_BID_API_URLS.auctionDetails
exports.BID_AUCTION_DETAILS_URL = this.BID_AUCTION_DETAILS_BASE.url
exports.BID_AUCTION_DETAILS_PARAMS = this.BID_AUCTION_DETAILS_BASE.params
exports.BID_AUCTION_DETAILS_PARAMS_AUCTIONID = this.BID_AUCTION_DETAILS_PARAMS.auctionId

/////////////////////////////////////////////////////////////////////

exports.CONFIG_FIREBASE = config.firebase

exports.FB_PROJECTID = this.CONFIG_FIREBASE.projectId
exports.FB_CLOUD_RESOURCE_LOCATION = this.CONFIG_FIREBASE.cloudResourceLocation

/////////////////////////////////////////////////////////////////////

exports.CONFIG_FIRESTORE = config.firestore

exports.FS_SERVICE_ACCOUNT = this.CONFIG_FIRESTORE.serviceAccount
exports.FS_SERVICE_ACCOUNT_ID = this.FS_SERVICE_ACCOUNT.userId

exports.FS_COLLECTIONS = this.CONFIG_FIRESTORE.collections
exports.FS_COLLECTIONS_INFO = this.FS_COLLECTIONS.info
exports.FS_COLLECTIONS_AUCTIONS = this.FS_COLLECTIONS.auctions
exports.FS_COLLECTIONS_USERS = this.FS_COLLECTIONS.users

exports.FS_FIELDS_AUCTION = this.FS_COLLECTIONS_AUCTIONS.fields
exports.FS_FIELDS_INFO = this.FS_COLLECTIONS_INFO.fields
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

exports.FS_INFO_TYPE = this.FS_FIELDS_INFO.type.name
exports.FS_INFO_VALUE = this.FS_FIELDS_INFO.value.name
exports.FS_INFO_TYPES = this.FS_COLLECTIONS_INFO.types

exports.FS_USER_BIDNUM = this.FS_FIELDS_USER.bidnum.name
exports.FS_USER_BIDPW = this.FS_FIELDS_USER.bidpw.name
exports.FS_USER_SESSION = this.FS_FIELDS_USER.session.name

exports.FS_SESSION_COOKIE = this.FS_FIELDS_USER_SESSION.cookie.name
exports.FS_SESSION_CSRF = this.FS_FIELDS_USER_SESSION.csrf.name
exports.FS_SESSION_EXPIRATION = this.FS_FIELDS_USER_SESSION.expiration.name

/////////////////////////////////////////////////////////////////////

exports.CONFIG_PUBSUB = config.pubsub

exports.PS_FIND_AUCTIONS_AMOUNT = this.CONFIG_PUBSUB.findAuctionsAmount
exports.PS_TOPICS = this.CONFIG_PUBSUB.topics