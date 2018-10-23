exports.pluralize = (noun, count) => {
    return count === 1 ? noun : (noun + 's')
}