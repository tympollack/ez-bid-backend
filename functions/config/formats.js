module.exports = {
    guid: {
        name: 'guid', // from https://www.guidgenerator.com/online-guid-generator.aspx
        validate: val => {
            const regex = !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
            // if (regex.test(val)) throw new Error('must be a valid 8-4-4-4-12 guid')
            if (val.match(regex)) throw new Error('must be a valid 8-4-4-4-12 guid')
        },
    },

    errorType: {
        name: 'errorType',
        validate: val => {
            if (!val.clean) throw new Error('error must include clean message')
            const status = val.status
            if (status && typeof status !== 'number') throw new Error('error status must be a number')
        }
    }
}