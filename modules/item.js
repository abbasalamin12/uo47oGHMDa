
'use strict'

// const fs = require('fs-extra')
const mime = require('mime-types')
const sqlite = require('sqlite-async')
const saltRounds = 10

module.exports = class Item {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store data about each computer
			const sql = 'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT,\
						 name TEXT, description TEXT);' //, cpu TEXT, ram TEXT, graphics_card TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	async addItem(name, description) {
		try {
			if(name.length === 0) throw new Error('missing item name')
			if(description.length === 0) throw new Error('missing item decription')
			let sql = `SELECT COUNT(id) as records FROM items WHERE name="${name}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`item name "${name}" already in use`)
			sql = `INSERT INTO items(name, description) VALUES("${name}", "${description}")`
			await this.db.run(sql)
			return true
		} catch(err) {
			throw err
		}
	}

	async uploadPicture(path, mimeType) {
		const extension = mime.extension(mimeType)
		console.log(`path: ${path}`)
		console.log(`extension: ${extension}`)
		//await fs.copy(path, `public/avatars/${username}.${fileExtension}`)
	}
}