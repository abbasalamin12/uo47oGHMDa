
'use strict'

const hbs = require('handlebars')
const two = 2

module.exports = hbs.registerHelper('formatPrice', (price) => {
	const priceStr = price.toString()
	const formattedPrice = `${priceStr.substr(0, priceStr.length-two)}.\
${priceStr.substr(priceStr.length-two, priceStr.length)}`
	return formattedPrice
})
