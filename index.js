#!/usr/bin/env node

//Routes File

'use strict'

/* MODULE IMPORTS */
const Koa = require('koa')
const Router = require('koa-router')
const Database = require('sqlite-async')
const views = require('koa-views')
const staticDir = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')({multipart: true, uploadDir: '.'})
const session = require('koa-session')
const fs = require('fs-extra')
const hbs = require('handlebars')
//const jimp = require('jimp')

/* IMPORT CUSTOM MODULES */
const User = require('./modules/user')
const Item = require('./modules/item')
const General = require('./modules/generalFunctions')

const gen = new General()
const app = new Koa()
const router = new Router()

/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, {map: { handlebars: 'handlebars' }}))
hbs.registerHelper('formatPrice', (price) => {
	const priceStr = price.toString()
	const formattedPrice = `${priceStr.substr(0, priceStr.length-two)}.\
${priceStr.substr(priceStr.length-two, priceStr.length)}`
	return formattedPrice
})

const defaultPort = 8080
const port = process.env.PORT || defaultPort
const dbName = 'website.db'

const two = 2 // this variable represents the amount of decimal places to format price with
const indentSpaces = 4 // this variable represents the amount of spaces to use when formatting JSON

let isAdmin = false

/**
 * The secure home page.
 *
 * @name Home Page
 * @route {GET} /
 * @authentication This route requires cookie-based authentication.
 */
router.get('/', async ctx => {
	try {
		gen.checkAuthorised(ctx)
		const data = {}
		if(ctx.query.msg) {
			data.msg = ctx.query.msg
			await ctx.render('index', {message: data.msg, isAdmin: isAdmin})
		} else await ctx.render('index', {isAdmin: isAdmin})
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The page where the user browses computers.
 *
 * @name Browse Page
 * @route {GET} /browse
 */
router.get('/browse', async ctx => {
	try {
		let sql = 'SELECT id, name, description, price, imageSRC FROM items;'
		let querystring = ''
		if(ctx.query !== undefined && ctx.query.q !== undefined) { // if there is a search query
			sql = `SELECT id, name, description, price, imageSRC FROM items 
							WHERE upper(name) LIKE "%${ctx.query.q}%" 
							OR upper(description) LIKE upper("%${ctx.query.q}%");`
			querystring = ctx.query.q
		}
		const db = await Database.open(dbName)
		const data = await db.all(sql)
		await db.close()
		await ctx.render('browse', {items: data, query: querystring, isAdmin: isAdmin})
	} catch(err) {
		ctx.body = err.message
	}
})

/**
 * The page where the user can purchase and look at details of specific computers.
 *
 * @name Details/Purchase Page
 * @route {GET} /details/:id
 * 
 */
router.get('/details/:id', async ctx => {
	try {
		const sql = `SELECT id, name, description, price, imageSRC FROM items WHERE id = ${ctx.params.id};`
		const db = await Database.open(dbName); const data = await db.get(sql); await db.close()
		const JSONFile = fs.readFileSync('itemData.json', 'utf-8')
		const parsedData = JSON.parse(JSONFile)
		if(parsedData.itemData[`${data.name}`]) {
			const itemData = parsedData.itemData[`${data.name}`]
			const optionData = {'size': itemData.size, 'color': itemData.color}
			const imagePaths = itemData.images
			await ctx.render('details', {data: data, itemOptions: optionData, imagePaths: imagePaths, isAdmin: isAdmin})
		} else await ctx.render('details', {data, isAdmin: isAdmin})
	} catch(err) {
		ctx.body = err.message
		if(err.code === 'ENOENT') {
			gen.writeData('itemData.json', '{"itemData": {}}')
			ctx.redirect(`/details/${ctx.params.id}`)
		}
	}
})

/**
 * The page where the user can view items that they added to their cart
 *
 * @name Cart Page
 * @route {GET} /cart
 * @authentication This route requires cookie-based authentication.
 * 
 */
router.get('/cart', async ctx => {
	try {
		gen.checkAuthorised(ctx)
		const JSONFile = fs.readFileSync('carts.json', 'utf-8')
		const data = JSON.parse(JSONFile)
		const cartItems = data.carts[ctx.session.User]
		if(!cartItems) await ctx.render('cart', {isAdmin: isAdmin})
		else {
			let totalPrice = 0
			for(const i in cartItems) totalPrice += parseInt(cartItems[i].price)
			await ctx.render('cart', {cartItems: cartItems, totalItemPrice: totalPrice, isAdmin: isAdmin})
		}
	} catch(err) { // creates carts.json if it doesn't exist
		if(err.code === 'ENOENT') {
			gen.writeData('carts.json', '{"carts": {}}')
			ctx.redirect('/cart')
		}
		ctx.body = err.message
	}
})

/**
 * The script to process adding an item to user cart.
 *
 * @name AddToCart Script
 * @route {POST} /cart
 * @authentication This route requires cookie-based authentication.
 */
router.post('/cart', koaBody, async ctx => {
	try {
		gen.checkAuthorised(ctx)
		const body = ctx.request.body
		const user = await new User(dbName)
		if(body.id!==undefined) await user.addToCart(ctx.session.User, body)
		await ctx.redirect('/cart')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The script to process removing items from user cart.
 *
 * @name remove-from-cart Script
 * @route {POST} /remove-from-cart
 */
router.post('/remove-from-cart', koaBody, async ctx => {
	try {
		const body = ctx.request.body
		const JSONFile = fs.readFileSync('carts.json', 'utf-8')
		const data = JSON.parse(JSONFile)
		let userCart = data.carts[ctx.session.User]

		gen.removeArrFromArr(body, userCart).then( newJSON => {
			userCart = JSON.parse(newJSON)
			data.carts[ctx.session.User] = userCart

			const formattedData = JSON.stringify(data, null, indentSpaces)
			gen.writeData('carts.json', formattedData)
		})
		await ctx.redirect('/cart')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The user registration page.
 *
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => await ctx.render('register', {isAdmin: isAdmin}))

/**
 * The script to process new user registrations.
 *
 * @name Register Script
 * @route {POST} /register
 */
router.post('/register', koaBody, async ctx => {
	try {
		// extract the data from the request
		const body = ctx.request.body
		console.log(body)
		// call the functions in the module
		const user = await new User(dbName)
		await user.register(body.user, body.pass, body.addrLine, body.city, body.postcode)
		// redirect to the home page
		ctx.redirect(`/?msg=new user "${body.name}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The user registration page.
 *
 * @name Settings Page
 * @route {GET} /settings
 */
router.get('/settings', async ctx => {
	try {
		gen.checkAuthorised(ctx)
		// get current details
		const sql = `SELECT addrLine, city, postcode FROM users WHERE user='${ctx.session.User}'`
		const db = await Database.open(dbName);
		const data = await db.get(sql)
		await db.close()
		await ctx.render('settings', {currentDetails: data, isAdmin: isAdmin})
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The script to process user settings change.
 *
 * @name UpdateDetails Script
 * @route {POST} /settings
 */
router.post('/settings', koaBody, async ctx => {
	try {
		// extract the data from the request
		const body = ctx.request.body

		const user = await new User(dbName)
		await user.updateDetails(ctx.session.User, body.addrLine, body.city, body.postcode)
		// redirect to the home page
		ctx.redirect('/?msg=contact details have been updated')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The admin page for adding new items.
 *
 * @name Add Item Page
 * @route {GET} /add-item
 * @authentication This route requires cookie-based authentication.
 */
router.get('/add-item', async ctx => {
	gen.checkAuthorised(ctx)
	if(ctx.session.isAdmin) {
		await ctx.render('add-item', {isAdmin: isAdmin})
	} else {
		ctx.redirect('/?msg=Only admins can use this page')
	}	
})
/**
 * The script to process adding new items.
 *
 * @name Add Item Script
 * @route {POST} /add-item
 */
router.post('/add-item', koaBody, async ctx => {
	try {
		const images = ctx.request.files.itemPicture // gets the path for uploaded image
		const body = ctx.request.body;const item = await new Item(dbName)
		await item.addItem(body.name, body.description, body.price)
		if(!Array.isArray(images)) await item.uploadPicture(images.path, images.type, body.name, 0)
		else for(const i in images) await item.uploadPicture(images[i].path, images[i].type, body.name, i)
		const JSONFile = fs.readFileSync('itemData.json', 'utf-8')
		const data = JSON.parse(JSONFile)
		gen.saveItemOptions('itemData.json', data, body.name, body.sizeOptions, body.colorOptions)
		ctx.redirect(`/?msg=new item "${body.name}" added`)
	} catch(err) {
		if(err.code === 'ENOENT') {
			const body = ctx.request.body; const data = {'itemData': {} }
			gen.saveItemOptions('itemData.json', data, body.name, body.sizeOptions, body.colorOptions)
			ctx.redirect('/')
		} else await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The page where users log in.
 *
 * @name Login Page
 * @route {get} /login
 */
router.get('/login', async ctx => {
	const data = {}
	if(ctx.query.msg) data.msg = ctx.query.msg
	if(ctx.query.user) data.user = ctx.query.user
	await ctx.render('login', data, isAdmin)
})

/**
 * The script to process authenticating a user.
 *
 * @name Login Script
 * @route {POST} /login
 */
router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		const user = await new User(dbName)
		await user.login(body.user, body.pass)
		ctx.session.authorised = true
		ctx.session.User = body.user
		await gen.checkIfAdmin(ctx, dbName)
		isAdmin = ctx.session.isAdmin
		return ctx.redirect('/?msg=you are now logged in...')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: isAdmin})
	}
})

/**
 * The script to process logging a user out.
 *
 * @name Logout Script
 * @route {get} /logout
 */
router.get('/logout', async ctx => {
	ctx.session.authorised = null
	ctx.redirect('/?msg=you are now logged out')
})

app.use(router.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))
