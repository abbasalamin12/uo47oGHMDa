/**
 * A module containing general functions used on the site.
 * @module generalFunctions
 */


'use strict'

const fs = require('fs-extra')
const sqlite = require('sqlite-async')
const indentSpaces = 4 // this is the amount of indents to use when formatting json

module.exports = class generalFunctions {
	/**
	 * @function writeData
	 * This function is used write data to an existing file.
	 *
	 * @param {string} filename - The file name that is being written to.
	 * @param {string} data - The data that is going to be written to the file.
	 */
	async writeData(filename, data) {
		fs.writeFile(filename, data, (err) => {
			if(err) {
				throw err
			}
		})
		return true
	}

	/**
	 * @function checkIfStringMissing
	 * This function is used to validate strings as not being empty.
	 *
	 * @param {string} varValue - The value of the string being validated.
	 * @param {string} varName - The name of the value being validated.
	 */
	async checkIfStringMissing(varValue, varName) {
		try {
			if(varValue.length === 0) throw new Error(`missing ${varName}`)
			else return true
		} catch(err) {
			throw err
    	}
	}

	/**
	 * @function saveItemOptions
	 * This function is used save extra item options to a JSON.
	 *
	 * @param {string} filename - The file name that is being written to.
	 * @param {string} data - The json data that is going to be written to the file.
	 * @param {string} filename - The name of the item that is getting options added.
	 * @param {string[]} sizeOptions - The list of dropdown options being added for size.
	 * @param {string[]} colorOptions - The list of dropdown options being added for size.
	 */
	async saveItemOptions(fileName, data, itemName, sizeOptions, colorOptions) {
		try {
			if(!data.itemData[`${itemName}`]) data.itemData[`${itemName}`] = {}
			if(sizeOptions) data.itemData[`${itemName}`].size = sizeOptions.split(',')
			if(colorOptions) data.itemData[`${itemName}`].color = colorOptions.split(',')
			this.writeData(fileName, JSON.stringify(data, null, indentSpaces))
		} catch(err) {
			throw err
		}
	}

	/**
	 * @function checkAuthorised
	 * This function is used to check if the site user is logged in.
	 *
	 * @param {Object} ctx - This is the context object which stores the cookies.
	 */
	async checkAuthorised(ctx) {
		try {
			if(ctx.session.authorised !== true) ctx.redirect('/login?msg=you need to log in')
		} catch(err) {
			throw err
		}
	}

	/**
	 * @function checkIfAdmin
	 * This function is used to check if the logged in user is an admin and sets it in the cookies.
	 *
	 * @param {Object} ctx - This is the context object which stores the cookies.
	 * @param {string} dbName - This is the name of the database that stores the user table.
	 */
	async checkIfAdmin(ctx, dbName) {
		try {
			const user = ctx.session.User
			const sql = `SELECT isAdmin FROM users WHERE user="${user}"`
			const db = await sqlite.open(dbName)
			const data = await db.get(sql)
			if(data.isAdmin!=='true') {
				ctx.session.isAdmin = false
			} else {
				ctx.session.isAdmin = true
			}
		} catch(err) {
			throw err
		}
	}

	/**
	 * @function removeArrFromArr
	 * This function is used to delete an array from within another array.
	 *
	 * @param {Object[]} arr1 - This is the array that is being removed.
	 * @param {Object[]} arr2 - This is the array that arr1 is being removed from.
	 * @returns {string} - Returns a stringified version of the new array
	 */
	async removeArrFromArr(arr1, arr2) {
		try {
			const strungArr1 = JSON.stringify(arr1)
			let strungArr2 = JSON.stringify(arr2)

			// removes the array with safety if the array is at the end of the json
			strungArr2 = strungArr2.replace(strungArr1.concat(','), '') // if the array isn't the last or only item
			strungArr2 = strungArr2.replace(','.concat(strungArr1), '') // if the array is the last item
			strungArr2 = strungArr2.replace(strungArr1, '') // if the array is the only item
			return strungArr2
		} catch(err) {
			throw err
		}
	}

	/**
	 * @function addToArrayIfNotDuplicate
	 * This function is used to add an array to another array as long as it isn't already in there.
	 *
	 * @param {Object[]} arr1 - This is the array that is being added.
	 * @param {Object[]} arrayList - This is the array that arr1 is being added to.
	 */
	async addToArrayIfNotDuplicate(arr, arrayList) {
		/* this function checks to see if an array exists in a list
		   of arrays and if it doesn't exist, it adds it. */
		try {
			for(let i=0; i<arrayList.length; i++) {
				if(JSON.stringify(arrayList[i])===JSON.stringify(arr)) {
					return true
				}
			}
			arrayList.push(arr)
		} catch(err) {
			throw err
		}
	}
}
