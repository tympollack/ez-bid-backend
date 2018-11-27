const convict = require('convict')
const formats = require('./formats')
const schema = require('./schema')
const yaml = require('js-yaml')

Object.values(formats).forEach(format => convict.addFormat(format))

convict.addParser({ extension: ['yml', 'yaml'], parse: yaml.safeLoad})

const config = convict(schema)
config.loadFile('./config/.env.yml')
config.validate({ allowed: 'strict' })

module.exports = config