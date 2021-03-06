/**
 * User module
 * @module user
 */

'use strict'

const bcrypt = require('bcrypt-promise')
const fs = require('fs-extra')
const sqlite = require('sqlite-async')
const General = require('./generalFunctions')
const saltRounds = 10

const gen = new General()

module.exports = class User {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT,\
addrLine TEXT, city TEXT, postcode TEXT, isAdmin TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * @function register
	 * This function is used to add a new user account to the users table.
	 *
	 * @param {string} name - The name of the user being added.
	 * @param {string} pass - The password of the user being added.
	 * @param {string} addrLine - The address line of the user being added.
	 * @param {string} city - The city of the user being added.
	 * @param {string} postcode - The postcode of the user being added.
	 */
	async register(user, pass, addrLine, city, postcode) {
		try {
			await Promise.all([gen.checkIfStringMissing(user, 'username'),
				gen.checkIfStringMissing(pass, 'password') ,
				gen.checkIfStringMissing(addrLine, 'address line'),
				gen.checkIfStringMissing(city, 'city'),
				gen.checkIfStringMissing(postcode, 'postcode')
			]).catch()
			let sql = `SELECT COUNT(id) as records FROM users WHERE user="${user}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`username "${user}" already in use`)
			pass = await bcrypt.hash(pass, saltRounds)
			sql = `INSERT INTO users(user, pass, addrLine, city, postcode, isAdmin) \
			VALUES("${user}", "${pass}", "${addrLine}", "${city}", "${postcode}", "false")`
			await this.db.run(sql)
			return true
		} catch(err) {
			throw err
		}
	}


	/**
	 * @function addToCart
	 * This function is used to add items to a user's cart.
	 * The user's cart items are stored in a JSON file.
	 * @param {string} user - The name of the user that is having items added to their cart.
	 * @param {object[]} itemDetails - The details of the item being added to the user's cart.
	 */
	async addToCart(user, itemDetails) {
		const indentSpaces = 4 // this is the amount spaces to use when indenting the JSON
		fs.readFile('carts.json', (_err, data) => {
			try {
				data = JSON.parse(data)
				if(!data.carts[user]) data.carts[user] = [] // if cart doesn't exist, add a new cart
				const userCart = data.carts[user]
				gen.addToArrayIfNotDuplicate(itemDetails, userCart)// prevents adding duplicate items
				const jsonData = JSON.stringify(data, null, indentSpaces)
				gen.writeData('carts.json', jsonData)
			} catch(err) {
				const template = { 'carts': {} }
				const jsonTemplate = JSON.stringify(template)
				gen.writeData('carts.json', jsonTemplate)
				this.addToCart(user, itemDetails)
			}
		})
		return true
	}

	/**
	 * @function login
	 * This function is used to authenticate login attempts by comparing to the database.
	 *
	 * @param {string} username - The username that was inputted in the login attempt.
	 * @param {string} password - The password that was inputted in the login attempt.
	 */
	async login(username, password) {
		try {
			let sql = `SELECT count(id) AS count FROM users WHERE user="${username}";`
			const records = await this.db.get(sql)
			if(!records.count) throw new Error(`username "${username}" not found`)
			sql = `SELECT pass FROM users WHERE user = "${username}";`
			const record = await this.db.get(sql)
			const valid = await bcrypt.compare(password, record.pass)
			if(valid === false) throw new Error(`invalid password for account "${username}"`)
			return true
		} catch(err) {
			throw err
		}
	}

	/**
	 * @function updateDetails
	 * This function is used to update contact details of a user.
	 *
	 * @param {string} user - The name of the user being updated.
	 * @param {string} addrLine - The new address line value to update the user record with.
	 * @param {string} city - The new city value to update the user record with.
	 * @param {string} postcode - The new postcode value to update the user record with.
	 */
	async updateDetails(user, addrLine, city, postcode) {
		try {
			await Promise.all([gen.checkIfStringMissing(addrLine, 'address line'),
				gen.checkIfStringMissing(city, 'city'),
				gen.checkIfStringMissing(postcode, 'postcode')
			]).catch()
			const sql = `UPDATE users SET addrLine="${addrLine}", city="${city}",\
postcode="${postcode}" WHERE user="${user}";`
			await this.db.run(sql)
			return true
		} catch(err) {
			throw err
		}
	}

}
