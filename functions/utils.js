exports.firestoreGetThingById = (db, collection, id) => {
    return new Promise(resolve => {
        db.collection(collection.name)
            .doc(id)
            .onSnapshot(doc => {
                resolve(doc.data())
            })
    })
}

exports.pluralize = (noun, count) => {
    return count === 1 ? noun : (noun + 's')
}

exports.reqWrapper = (req, res, next) => {
    try {
        next()
    } catch (e) {
        console.error(e)
        res.status(500).send(e)
    }
}