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

exports.reqWrapper = async (req, res, next) => {
    try {
        await next()
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
}