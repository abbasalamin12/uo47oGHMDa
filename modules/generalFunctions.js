
'use strict'

const fs = require('fs-extra')
const sqlite = require('sqlite-async')
const indentSpaces = 4 // this is the amount of indents to use when formatting json

module.exports = class generalFunctions {

	async writeData(filename, data) {
		fs.writeFile(filename, data, (err) => {
			if(err) {
				throw err
			}
		})
		return true
	}

	async checkIfStringMissing(varValue, varName) {
		// this was created to help with cyclomatic complexity
		try {
			if(varValue.length === 0) throw new Error(`missing ${varName}`)
		} catch(err) {
			throw err
    	}
	}

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

	async checkAuthorised(ctx) {
		try {
			if(ctx.session.authorised !== true) ctx.redirect('/login?msg=you need to log in')
		} catch(err) {
			throw err
		}
	}

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
