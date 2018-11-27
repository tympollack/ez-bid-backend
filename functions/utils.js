exports.firestoreGetThingById = (db, collection, id) => {
    return new Promise(resolve => {
        db.collection(collection)
            .doc(id)
            .onSnapshot(doc => {
                resolve(doc.data())
            })
    })
}

exports.pluralize = (noun, count) => {
    return count === 1 ? noun : (noun + 's')
}

exports.tryCatchAsync = async (req, res, next) => {
    try {
        await next()
    } catch (e) {
        const easter = '' + e
        console.error(easter)
        res.status(500).send(easter)
    }
}