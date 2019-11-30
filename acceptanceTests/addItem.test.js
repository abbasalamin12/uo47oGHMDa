
'use strict'

const puppeteer = require('puppeteer')
const { configureToMatchImageSnapshot } = require('jest-image-snapshot')
const PuppeteerHar = require('puppeteer-har')
const shell = require('shelljs')

const width = 800
const height = 600
const delayMS = 5

let browser
let page
let har

// threshold is the difference in pixels before the snapshots dont match
const toMatchImageSnapshot = configureToMatchImageSnapshot({
	customDiffConfig: { threshold: 2 },
	noColors: true,
})
expect.extend({ toMatchImageSnapshot })

beforeAll( async() => {
	browser = await puppeteer.launch({ headless: true, slowMo: delayMS, args: [`--window-size=${width},${height}`] })
	page = await browser.newPage()
	har = new PuppeteerHar(page)
	await page.setViewport({ width, height })
	await shell.exec('acceptanceTests/scripts/beforeAll.sh')
})

afterAll( async() => {
	browser.close()
	await shell.exec('acceptanceTests/scripts/afterAll.sh')
})

beforeEach(async() => {
	await shell.exec('acceptanceTests/scripts/beforeEach.sh')
})

describe('AddingItemToDB', () => {
	test('Adding a new item to the db', async done => {
		//start generating a trace file.
		await page.tracing.start({path: 'trace/adding_item_to_db_har.json',screenshots: true})
		await har.start({path: 'trace/adding_item_to_db_trace.har'})
		//ARRANGE
		// register and login first
		await page.goto('http://localhost:8080/register', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=user]', 'NewUser') /// registering a new account
		await page.type('input[name=pass]', 'password')
		await page.type('input[name=addrLine]', 'address line')
		await page.type('input[name=city]', 'city')
		await page.type('input[name=postcode]', 'postcode')
		await page.click('input[type=submit]')
		await page.goto('http://localhost:8080/login', { timeout: 30000, waitUntil: 'load' }) //logging in
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')

		await page.goto('http://localhost:8080/become-admin', { timeout: 30000, waitUntil: 'load' })
		await page.goto('http://localhost:8080/add-item', { timeout: 30000, waitUntil: 'load' })

		//ACT
		await page.type('input[name=name]', 'computer')
		await page.type('textarea[name=description]', 'a powerful computer')
		await page.type('input[name=price]', '9999')
		await page.type('input[name=colorOptions]', 'black,blue')
		await page.type('input[name=sizeOptions]', 'big,small')
		await page.click('input[type=submit]')

		// //ASSERT
		// //check that the user is taken to the homepage after succesfully adding an item
		// await page.waitForSelector('h1')
		// expect( await page.evaluate( () => document.querySelector('h1').innerText ) )
		// 	.toBe('Home')
		// await page.waitForSelector('p.msg')
		// expect( await page.evaluate( () => document.querySelector('p.msg').innerText ) )
		// 	.toBe('new item "computer" added')

		// // grab a screenshot
		const image = await page.screenshot()
		// // compare to the screenshot from the previous test run
		expect(image).toMatchImageSnapshot()
		// // stop logging to the trace files
		await page.tracing.stop()
		await har.stop()
		done()
	}, 16000)

	// test('viewing item details', async done => {
	// 	//start generating a trace file.
	// 	await page.tracing.start({path: 'trace/viewing_item_details_har.json',screenshots: true})
	// 	await har.start({path: 'trace/viewing_item_details_trace.har'})
	// 	//ARRANGE
	// 	await page.goto('http://localhost:8080/add-item', { timeout: 30000, waitUntil: 'load' })
	// 	//ACT
	// 	await page.type('input[name=name]', 'computer') /// registering a new account
	// 	await page.type('textarea[name=description]', 'a powerful computer')
	// 	await page.type('input[name=price]', '9999')
	// 	await page.type('input[name=colorOptions]', 'black,blue')
	// 	await page.type('input[name=sizeOptions]', 'big,small')
	// 	await page.click('input[type=submit]')

	// 	await page.goto('http://localhost:8080/details/1', { timeout: 30000, waitUntil: 'load' }) //logging in
	// 	//ASSERT
	// 	//check that the details page correctly displays details for new item:
	// 	await page.waitForSelector('h1')
	// 	expect( await page.evaluate( () => document.querySelector('h1').innerText ) )
	// 		.toBe('computer')
	// 	// await page.waitForSelector('h1')
	// 	// expect( await page.evaluate( () => document.querySelector('h1').innerText ) )
	// 	// 	.toBe('computer')
	// 	const test = await page.evaluate(() => Array.from(document.querySelectorAll('[size="true"]'), element => element.textContent));
	// 	console.log(test)
	// 	//await page.select("select#first", "Apple")

	// 	// grab a screenshot
	// 	const image = await page.screenshot()
	// 	// compare to the screenshot from the previous test run
	// 	expect(image).toMatchImageSnapshot()
	// 	// stop logging to the trace files
	// 	await page.tracing.stop()
	// 	await har.stop()
	// 	done()
	// }, 16000)
})
