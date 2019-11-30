
'use strict'

const hbs = require('handlebars')

const pointZeroOne = 0.01 // this is the number to use to make numbers into a multiplier
const two = 2 // this is the number of digits to show after a decimal point when formatting price
const hundred = 100 // used to convert discount multiplier back to whole number

module.exports = hbs.registerHelper('formatPrice', (price) => (price*pointZeroOne).toFixed(two) )

hbs.registerHelper('discountValid', (discount) => {
	if(discount<1 && discount>0) return true
})

hbs.registerHelper('applyDiscountAndFormat', (discount, price) => (discount*price*pointZeroOne).toFixed(two))

hbs.registerHelper('formatDiscount', (discount) => hundred-discount*hundred)
