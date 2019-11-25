
'use strict'

const Accounts = require('../modules/user.js')

describe('register()', () => {

	test('register a valid account', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		const register = await account.register('doej', 'password', 'doej street', 'doej town', 'DO4 2EJ')
		expect(register).toBe(true)
		done()
	})

	test('register a duplicate username', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password', 'doej street', 'doej town', 'DO4 2EJ')
		await expect( account.register('doej', 'password', 'doej street', 'doej town', 'DO4 2EJ') )
			.rejects.toEqual( Error('username "doej" already in use') )
		done()
	})

	test('error if blank username', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect( account.register('', 'password', 'doej street', 'doej town', 'DO4 2EJ') )
			.rejects.toEqual( Error('missing username') )
		done()
	})

	test('error if blank password', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect( account.register('doej', '', 'doej street', 'doej town', 'DO4 2EJ') )
			.rejects.toEqual( Error('missing password') )
		done()
	})

	test('error if blank address line', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect( account.register('doej', 'password', '', 'doej town', 'DO4 2EJ') )
			.rejects.toEqual( Error('missing address line') )
		done()
	})

	test('error if blank city', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect( account.register('doej', 'password', 'doej street', '', 'DO4 2EJ') )
			.rejects.toEqual( Error('missing city') )
		done()
	})

	test('error if blank postcode', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await expect( account.register('doej', 'password', 'doej street', 'doej town', '') )
			.rejects.toEqual( Error('missing postcode') )
		done()
	})

})

describe('uploadPicture()', () => {
	// this would have to be done by mocking the file system
	// perhaps using mock-fs?
})

describe('addToCart()', () => {
	/*test('add an item to the user cart', async done => {
		expect.assertions(1)
	})*/
	// need to use mock-fs to test this
})

describe('login()', () => {
	test('log in with valid credentials', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password', 'doej street', 'doej town', 'DO4 2EJ')
		const valid = await account.login('doej', 'password')
		expect(valid).toBe(true)
		done()
	})

	test('invalid username', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password', 'doej street', 'doej town', 'DO4 2EJ')
		await expect( account.login('roej', 'password') )
			.rejects.toEqual( Error('username "roej" not found') )
		done()
	})

	test('invalid password', async done => {
		expect.assertions(1)
		const account = await new Accounts()
		await account.register('doej', 'password', 'doej street', 'doej town', 'DO4 2EJ')
		await expect( account.login('doej', 'bad') )
			.rejects.toEqual( Error('invalid password for account "doej"') )
		done()
	})

})
