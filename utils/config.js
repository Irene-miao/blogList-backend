// Handle environment variables

require('dotenv').config()
const process = require('process')

const PORT = process.env.PORT
const url = process.env.NODE_ENV === 'test' ? process.env.TEST_mongoUrl : process.env.mongoUrl

module.exports = {
    PORT, 
    url
}