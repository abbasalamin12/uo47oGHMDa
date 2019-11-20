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

const app = new Koa()
const router = new Router()

/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, {map: { handlebars: 'handlebars' }}))
hbs.registerHelper('formatPrice', (price) => price.toFixed(two))


const defaultPort = 8080
const port = process.env.PORT || defaultPort
const dbName = 'website.db'

// this variable represents the amount of decimal places to format price with
const two = 2

/**
 * The secure home page.
 *
 * @name Home Page
 * @route {GET} /
 * @authentication This route requires cookie-based authentication.
 */
router.get('/', async ctx => {
	try {
		if(ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')
		const data = {}
		if(ctx.query.msg) data.msg = ctx.query.msg
		await ctx.render('index')
	} catch(err) {
		await ctx.render('error', {message: err.message})
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
		console.log(ctx.query.q)
		if(ctx.query !== undefined && ctx.query.q !== undefined) { // if there is a search query
			sql = `SELECT id, name, description, price, imageSRC FROM items 
							WHERE upper(name) LIKE "%${ctx.query.q}%" 
							OR upper(description) LIKE upper("%${ctx.query.q}%");`
			querystring = ctx.query.q
		}
		const db = await Database.open(dbName)
		const data = await db.all(sql)
		await db.close()
		console.log(data)
		await ctx.render('browse', {items: data, query: querystring})
	} catch(err) {
		ctx.body = err.message
	}
})

/**
 * The page where the user can purchase and look at details of specific computers.
 *
 * @name Details/Purchase Page
 * @route {GET} /details/:id
 */
router.get('/details/:id', async ctx => {
	try {
		console.log(ctx.params.id)
		const sql = `SELECT id, name, description, price,\
		 imageSRC FROM items WHERE id = ${ctx.params.id};`
		const db = await Database.open(dbName)
		const data = await db.get(sql)
		await db.close()
		console.log(data)
		await ctx.render('details', data)
	} catch(err) {
		ctx.body = err.message
	}
})

router.get('/cart', async ctx => {
	try {
		const JSONFile = fs.readFileSync('carts.json', 'utf-8')
		const data = JSON.parse(JSONFile)
		const cartItems = data.carts[ctx.session.User]
		const sql = `SELECT id, name, description, price, imageSRC FROM items\
		 WHERE id in (${cartItems});`
		const sql2 = `SELECT SUM(price) as totalPrice FROM ITEMS WHERE id in (${cartItems});`
		const db = await Database.open(dbName)
		const cartItemData = await db.all(sql)
		const totalPrice = await db.get(sql2)
		db.close()

		console.log(cartItemData)

		await ctx.render('cart', {cartItems: cartItemData, totalItemPrice: totalPrice})
	} catch(err) {
		ctx.body = err.message
	}
})

router.post('/cart', koaBody, async ctx => {
	try {
		const body = ctx.request.body
		console.log(body)
		const user = await new User(dbName)
		await user.addToCart(ctx.session.User, body.itemID)
		await ctx.redirect('/cart')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * The user registration page.
 *
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => await ctx.render('register'))

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
		await user.register(body.user, body.pass)
		// await user.uploadPicture(path, type)
		// redirect to the home page
		ctx.redirect(`/?msg=new user "${body.name}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message})
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
	if(ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')
	await ctx.render('add-item')
})
/**
 * The script to process adding new items.
 *
 * @name Add Item Script
 * @route {POST} /add-item
 */
router.post('/add-item', koaBody, async ctx => {
	try {
		// extract the data from the request
		const {path, type} = ctx.request.files.itemPicture // gets the path for uploaded image
		const body = ctx.request.body
		console.log(body)
		// call the functions in the module
		const item = await new Item(dbName)
		await item.addItem(body.name, body.description)
		await item.uploadPicture(path, type, body.name)
		// redirect to the home page
		ctx.redirect(`/?msg=new item "${body.name}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/login', async ctx => {
	const data = {}
	if(ctx.query.msg) data.msg = ctx.query.msg
	if(ctx.query.user) data.user = ctx.query.user
	await ctx.render('login', data)
})

router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		const user = await new User(dbName)
		await user.login(body.user, body.pass)
		ctx.session.authorised = true
		ctx.session.User = body.user
		console.log(ctx.session.User)
		return ctx.redirect('/?msg=you are now logged in...')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/logout', async ctx => {
	ctx.session.authorised = null
	ctx.redirect('/?msg=you are now logged out')
})

app.use(router.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))
