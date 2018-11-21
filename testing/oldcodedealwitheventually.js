// db.enablePersistence().catch(error => {
//     if (error.code === 'failed-precondition') {
// Multiple tabs open, persistence can only be enabled
// in one tab at a a time.
// } else if (error.code === 'unimplemented') {
// The current browser does not support all of the
// features required to enable persistence
// }
// })


// exports.processNewAuctions = functions.https.onRequest(async (req, res) => {
//         const maxPages = 2
//         let i = 1
//         let total = 0
//         let continueProcessing
//
//         do {
//             const url = auctionsUrl + i
//             continueProcessing = await fetch(url, params).then(response => response.json())
//                 .then(async d => {
//                     const auctionList = d.content
//                     const len = auctionList.length
//                     if (!len) return false
//
//                     total += len
//                     console.log('getAuctionList processing page', i)
//                     return await addAuctionListToFirestore(auctionList)
//                 })
//                 .catch(error => {
//                     console.log('error:', error)
//                     return false
//                 })
//             i++
//         } while (continueProcessing && i < maxPages)
//
//         console.log('getAuctionList processed', i, utils.pluralize('page', i), total, utils.pluralize('auction', total))
//
//         res.status(200).send(JSON.stringify({
//             totalPages: i,
//             totalAuctions: total
//         }))
// })

// function addAuctionListToFirestore(auctionList) {
//     const batchSize = auctionList.length
//     console.log('addAuctionListToFirestore adding', batchSize, utils.pluralize('auction', batchSize))
//
// }