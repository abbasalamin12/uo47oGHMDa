
'use strict'

const hbs = require('handlebars')
const fs = require('fs-extra')

const two = 2 // this is the number of digits to show after a decimal point when formatting price
const pointZeroOne = 0.01 // this is the number to use to make numbers into a multiplier

const General = require('./modules/generalFunctions')
const gen = new General()

module.exports = hbs.registerHelper('formatPrice', (price) => {
	return price*pointZeroOne
})

hbs.registerHelper('applyDiscountCode', (code, price) => {
	try {
		const data = fs.readFileSync('discountCodes.json', 'utf-8')
		const codesWithValues = JSON.parse(data).discountCodes
		price = price*pointZeroOne
		const codes = Object.keys(codesWithValues)
		if(codes.includes(code)) {
			const multiplier = 1-codesWithValues[code]*pointZeroOne
			let newPrice = price*multiplier
			newPrice = parseFloat(newPrice.toFixed(two))
			return newPrice
		}
		else return price
	} catch(err) {
		if(err.code==='ENOENT') gen.writeData('discountCodes.json', JSON.stringify({'discountCodes': {}}))
	}
})
