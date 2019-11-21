
'use strict'

const bcrypt = require('bcrypt-promise')
const fs = require('fs-extra')
const mime = require('mime-types')
const sqlite = require('sqlite-async')
const saltRounds = 10

module.exports = class User {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	async register(user, pass) {
		try {
			if(user.length === 0) throw new Error('missing username')
			if(pass.length === 0) throw new Error('missing password')
			let sql = `SELECT COUNT(id) as records FROM users WHERE user="${user}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`username "${user}" already in use`)
			pass = await bcrypt.hash(pass, saltRounds)
			sql = `INSERT INTO users(user, pass) VALUES("${user}", "${pass}")`
			await this.db.run(sql)
			await this.db.close()
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

	async writeData(filename, data) {
		fs.writeFile(filename, data, (err) => {
			if(err) {
				throw err
			}
		})
	}

	async addToCart(user, item) {
		fs.readFile('carts.json', (err, data) => {
			if(err) {
				throw err
			}
			data = JSON.parse(data)
			if(!data.carts[user]) { // if cart doesn't exist, add a new cart
				data.carts[user] = []
			}
			const userCart = data.carts[user]
			if(!userCart.includes(item)) { // prevents adding duplicate items
				userCart.push(item)
			}
			// this is used to format and write the data to the file
			const indentSpaces = 4
			const jsonData = JSON.stringify(data, null, indentSpaces)
			this.writeData('carts.json', jsonData)
		})
	}

	async login(username, password) {
		try {
			let sql = `SELECT count(id) AS count FROM users WHERE user="${username}";`
			const records = await this.db.get(sql)
			if(!records.count) throw new Error(`username "${username}" not found`)
			sql = `SELECT pass FROM users WHERE user = "${username}";`
			const record = await this.db.get(sql)
			const valid = await bcrypt.compare(password, record.pass)
			if(valid === false) throw new Error(`invalid password for account "${username}"`)
			await this.db.close()
			return true
		} catch(err) {
			throw err
		}
	}

}
