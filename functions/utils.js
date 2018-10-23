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