
'use strict'

const fs = require('fs-extra')
const indentSpaces = 4 // this is the amount of indents to use when formatting json
const five = 5 // this is the number to substract from filename to get rid of .json part

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
			data.itemOptions[`${itemName}`] = {}
			data.itemOptions[`${itemName}`].size = sizeOptions.split(',')
			data.itemOptions[`${itemName}`].color = colorOptions.split(',')
			this.writeData(fileName, JSON.stringify(data, null, indentSpaces))
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

	/*
	async readAndParseJSON(fileName) {
		try {
			const JSONFile = fs.readFileSync(fileName, 'utf-8')
			const data = JSON.parse(JSONFile)
			return data
		} catch(err) {
			if(err.code === 'ENOENT') { // if the file doesnt exist, it creates it and recurses the function
				const JSONTitle = fileName.substr(0, fileName.length-five) //this removes the .json from string
				const data = JSON.stringify(`${JSONTitle} : {}`)
				console.log(data)
				this.writeData(fileName, data)
				//return this.readAndParseJSON(fileName)
			} else {
				throw err
			}
		}
	}*/

}
