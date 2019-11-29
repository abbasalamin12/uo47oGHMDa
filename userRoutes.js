#!/usr/bin/env node

// UserRoutes File
// This file contains routes to do with the user

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
//const jimp = require('jimp')

/* IMPORT CUSTOM MODULES */
const User = require('./modules/user')
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

const dbName = 'website.db'
const indentSpaces = 4 // this variable represents the amount of spaces to use when formatting JSON
const pointZeroOne = 0.01 // this is the number to use to make numbers into a multiplier

/**
 * The user registration page.
 *
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => await ctx.render('register', {isAdmin: ctx.session.isAdmin}))

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
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
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
	await ctx.render('login', data, ctx.session.isAdmin)
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
		return ctx.redirect('/?msg=you are now logged in...')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
	}
})

/**
 * The script to process logging a user out.
 *
 * @name Logout Script
 * @route {get} /logout
 */
router.get('/logout', async ctx => {
	ctx.session.authorised = null;ctx.session.discount = 1
	ctx.redirect('/?msg=you are now logged out')
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
		const data = JSON.parse(fs.readFileSync('carts.json', 'utf-8'))
		const cartItems = data.carts[ctx.session.User]
		if(!cartItems) await ctx.render('cart', {isAdmin: ctx.session.isAdmin})
		else {
			let totalPrice = 0
			for(const i in cartItems) totalPrice += parseInt(cartItems[i].price)
			await ctx.render('cart', {cartItems: cartItems, totalItemPrice: totalPrice,
				 isAdmin: ctx.session.isAdmin, discount: ctx.session.discount})
		}
	} catch(err) { // creates carts.json if it doesn't exist
		if(err.code === 'ENOENT') {
			gen.writeData('carts.json', '{"carts": {}}'); ctx.redirect('/cart')
		} else await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
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
		const body = ctx.request.body;const user = await new User(dbName)
		if(body.id!==undefined) await user.addToCart(ctx.session.User, body)
		await ctx.redirect('/cart')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
	}
})

/**
 * The script to process applying discounts
 *
 * @name ApplyDiscount Script
 * @route {POST} /apply-discount
 */
router.post('/apply-discount', koaBody, async ctx => {
	try {
		const body = ctx.request.body
		const codesWithValues = JSON.parse(fs.readFileSync('discountCodes.json', 'utf-8')).discountCodes
		const codes = Object.keys(codesWithValues)
		if(codes.includes(body.code)) { // if code is valid
			ctx.session.discount = 1-codesWithValues[body.code]*pointZeroOne // discount multiplier
			await ctx.redirect('/cart')
		} else await ctx.redirect('/cart')
	} catch(err) {
		if(err.code==='ENOENT') {
			gen.writeData('discountCodes.json', JSON.stringify({'discountCodes': {}}))
			await ctx.redirect('/cart')
		}
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
	}
})

/**
 * The script to process removing discounts
 *
 * @name RemoveDiscount Script
 * @route {POST} /remove-discount
 * @authentication This route requires cookie-based authentication.
 */
router.post('/remove-discount', koaBody, async ctx => {
	try {
		gen.checkAuthorised(ctx); ctx.session.discount = 1
		await ctx.redirect('/cart')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
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
		const data = JSON.parse(fs.readFileSync('carts.json', 'utf-8'))
		let userCart = data.carts[ctx.session.User]
		gen.removeArrFromArr(body, userCart).then( newJSON => {
			userCart = JSON.parse(newJSON)
			data.carts[ctx.session.User] = userCart
			const formattedData = JSON.stringify(data, null, indentSpaces)
			gen.writeData('carts.json', formattedData)
		})
		await ctx.redirect('/cart')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
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
		const db = await Database.open(dbName)
		const data = await db.get(sql)
		await db.close()
		await ctx.render('settings', {currentDetails: data, isAdmin: ctx.session.isAdmin})
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
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
		const body = ctx.request.body
		const user = await new User(dbName)
		await user.updateDetails(ctx.session.User, body.addrLine, body.city, body.postcode)
		// redirect to the home page
		ctx.redirect('/?msg=contact details have been updated')
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
	}
})

module.exports = router
