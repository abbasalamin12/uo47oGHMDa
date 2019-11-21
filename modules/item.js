
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
						 name TEXT, description TEXT, price NUMERIC, imageSRC TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	async checkIfStringMissing(varName) {
		// made this to reduce function complexity for addItem
		if(varName.length === 0) throw new Error(`missing item ${varName}`)
	}

	async addItem(name, description, price) {
		try {
			this.checkIfStringMissing(name)
			this.checkIfStringMissing(description)
			if(isNaN(price)) throw new Error('missing item price')

			let sql = `SELECT COUNT(id) as records FROM items WHERE name="${name}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`item name "${name}" already in use`)
			sql = `INSERT INTO items(name, description, price, imageSRC)\
			VALUES("${name}", "${description}", "${price}", "temp")`
			await this.db.run(sql)
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
		console.log(imageSRC)
		await fs.copy(path, `public/${imageSRC}`)
		//updates db record to include file image source
		const sql2 = `UPDATE items SET imageSRC = "${imageSRC}" WHERE id="${data.itemID}"`
		await this.db.run(sql2)
	}
}
