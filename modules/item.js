
'use strict'

const fs = require('fs-extra')
const mime = require('mime-types')
const sqlite = require('sqlite-async')

module.exports = class Item {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store data about each computer
			const sql = 'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT,\
						 name TEXT, description TEXT, imageSRC TEXT);' //, cpu TEXT, ram TEXT, graphics_card TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	async addItem(name, description) {
		try {
			if(name.length === 0) throw new Error('missing item name')
			if(description.length === 0) throw new Error('missing item description')
			let sql = `SELECT COUNT(id) as records FROM items WHERE name="${name}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`item name "${name}" already in use`)
			sql = `INSERT INTO items(name, description, imageSRC) VALUES("${name}", "${description}", "temp")`
			await this.db.run(sql)
			await this.db.close()
			return true
		} catch(err) {
			throw err
		}
	}

	async uploadPicture(path, mimeType, name) {
		const extension = mime.extension(mimeType)
		const sql = `SELECT id as itemID FROM items WHERE name="${name}";`
		const data = await this.db.get(sql)
		console.log(data)
		console.log(`name: ${name}`)
		console.log(`path: ${path}`)
		console.log(`extension: ${extension}`)
		const imageSRC = `item_images/${data.itemID}/${name}.${extension}`
		await fs.copy(path, `${imageSRC}`)
		//add file source to db
		const sql2 = `UPDATE items WHERE name="${name}",\
		SET imageSRC = "${imageSRC}";`
		await this.db.run(sql2)
		await this.db.close()
	}
}
