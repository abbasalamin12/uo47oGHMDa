
'use strict'

const fs = require('fs-extra')

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

}
