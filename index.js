#!/usr/bin/env node

//Routes File
// This file contains routes to do with the items

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
require('./handlebarHelpers')
//const jimp = require('jimp')

/* IMPORT CUSTOM MODULES */
const Item = require('./modules/item')
const General = require('./modules/generalFunctions')

const gen = new General()
const app = new Koa()
const router = new Router()
const userRoutes = require('./userRoutes')

/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, {map: { handlebars: 'handlebars' }}))

const defaultPort = 8080
const port = process.env.PORT || defaultPort

const indentSpaces = 4 // this variable represents the amount of spaces to use when formatting JSON
const notFound = 404 // this is the error code for when a page is not found.
const dbName = 'website.db'

// the routes:

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
			await ctx.render('index', {message: data.msg, isAdmin: ctx.session.isAdmin})
		} else await ctx.render('index', {isAdmin: ctx.session.isAdmin})
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
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
		await new Item(dbName) // creates the db if it doesn't exist yet
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
		await ctx.render('browse', {items: data, query: querystring, isAdmin: ctx.session.isAdmin})
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
			await ctx.render('details',
				{data: data, itemOptions: optionData, imagePaths: imagePaths, isAdmin: ctx.session.isAdmin})
		} else await ctx.render('details', {data, isAdmin: ctx.session.isAdmin})
	} catch(err) {
		if(err.code === 'ENOENT') {
			gen.writeData('itemData.json', '{"itemData": {}}')
			ctx.redirect(`/details/${ctx.params.id}`)
		} else ctx.body = err.message
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
		await ctx.render('add-item', {isAdmin: ctx.session.isAdmin})
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
		if(!Array.isArray(images)) {
			await gen.checkIfStringMissing(images.name, 'item image')
			await item.uploadPicture(images.path, images.type, body.name, 0)
		} else for(const i in images) await item.uploadPicture(images[i].path, images[i].type, body.name, i)
		const data = JSON.parse(fs.readFileSync('itemData.json', 'utf-8'))
		gen.saveItemOptions('itemData.json', data, body.name, body.sizeOptions, body.colorOptions)
		ctx.redirect(`/?msg=new item "${body.name}" added`)
	} catch(err) {
		if(err.code === 'ENOENT') {
			const body = ctx.request.body; const data = {'itemData': {} }
			gen.saveItemOptions('itemData.json', data, body.name, body.sizeOptions, body.colorOptions)
			ctx.redirect('/')
		} else await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
	}
})

/**
 * The admin page for adding new discount codes.
 *
 * @name Add Item Page
 * @route {GET} /add-code
 * @authentication This route requires cookie-based authentication.
 */
router.get('/add-code', async ctx => {
	gen.checkAuthorised(ctx)
	if(ctx.session.isAdmin) {
		await ctx.render('add-code', {isAdmin: ctx.session.isAdmin})
	} else {
		ctx.redirect('/?msg=Only admins can use this page')
	}
})

/**
 * The script to process adding new discount codes.
 *
 * @name Add Item Script
 * @route {POST} /add-item
 */
router.post('/add-code', koaBody, async ctx => {
	try {
		const body = ctx.request.body
		const JSONexists = fs.existsSync('discountCodes.json')
		if(!JSONexists) gen.writeData('discountCodes.json', JSON.stringify({'discountCodes': {}}))
		fs.readFile('discountCodes.json', (_err, data) => {
			try{
				data = JSON.parse(data)
				data.discountCodes[`${body.codeName}`] = parseInt(body.codeValue)
				gen.writeData('discountCodes.json', JSON.stringify(data, null, indentSpaces))
			} catch(err) {
				throw err
			}
		})
		ctx.redirect(`/?msg=new code "${body.codeName}" added for ${body.codeValue}%+off`)
	} catch(err) {
		await ctx.render('error', {message: err.message, isAdmin: ctx.session.isAdmin})
	}
})
app.use( async(ctx, next) => { // inspired by https://github.com/ZijianHe/koa-router/issues/371#issuecomment-322842247
	await next()
	const errorMessage = 'Error 404: Page not found'
	if(ctx.status===notFound) await ctx.render('error', {message: errorMessage, isAdmin: ctx.session.isAdmin})
})

app.use(router.routes())
app.use(userRoutes.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))
