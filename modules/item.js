/**
 * Item Module
 * @module item
 */

'use strict'

const fs = require('fs-extra')
const mime = require('mime-types')
const sqlite = require('sqlite-async')
const General = require('./generalFunctions')

const gen = new General()
const indentSpaces = 4 // this variable represents the amount of spaces to use when formatting JSON

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

	/**
	 * @function addItem
	 * This function is used to add a new item to the items table.
	 *
	 * @param {string} name - The name of the item being added.
	 * @param {string} description - A description of the item being added.
	 * @param {number} price - The price of the item being added. (399.99 entered as 39999)
	 */
	async addItem(name, description, price) {
		try {
			await Promise.all([
				gen.checkIfStringMissing(name, 'item name'),
				gen.checkIfStringMissing(description, 'item description')]).catch()
			if(isNaN(parseInt(price))) throw new Error('missing item price')

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

	/**
	 * @function uploadPicture 
	 * This function is used to add an image to an item.
	 * The image path is saved in a json with the item name as a reference.
	 * @param {string} path - The path of the image being used
	 * @param {string} mimeType - The file extension of the image.
	 * @param {string} name - The name of the item.
	 * @param {number} imgNo - The id number for the image, in the case of multiple images.
	 */
	async uploadPicture(path, mimeType, name, imgNo) {
		try {
			const itemSQLData = await this.db.get(`SELECT id as itemID FROM items WHERE name="${name}";`)
			const imageSRC = `item_images/${itemSQLData.itemID}/${name}${imgNo}.${mime.extension(mimeType)}`
			await fs.copy(path, `public/${imageSRC}`)
			const sql2 = `UPDATE items SET imageSRC = "${imageSRC}" WHERE id="${itemSQLData.itemID}"`
			await this.db.run(sql2)
			const JSONexists = fs.existsSync('itemData.json')
			if(!JSONexists) gen.writeData('itemData.json', JSON.stringify({'itemData': {}}))
			fs.readFile('itemData.json', (_err, data) => {
				data = JSON.parse(data)
				if(!data.itemData[`${name}`]) data.itemData[`${name}`] = {}
				if(!data.itemData[`${name}`].images) data.itemData[`${name}`].images = []
				const imgPaths = data.itemData[`${name}`].images; imgPaths.push(imageSRC)
				gen.writeData('itemData.json', JSON.stringify(data, null, indentSpaces))
			})
		} catch(err) {
			throw err
		}
	}
}
