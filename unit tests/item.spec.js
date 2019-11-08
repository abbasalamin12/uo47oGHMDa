
'use strict'

const Item = require('../modules/item.js')

describe('addItem()', () => {
	test('add a valid item', async done => {
		expect.assertions(1)
		const item = await new Item()
		const addItem = await item.addItem('computer', 'a nice computer')
		expect(addItem).toBe(true)
		done()
	})

	test('add a duplicate item', async done => {
		expect.assertions(1)
		const item = await new Item()
		await item.addItem('computer', 'a nice computer')
		await expect( item.addItem('computer', 'a nice computer') )
			.rejects.toEqual( Error('item name "computer" already in use'))
		done()
	})

	test('add an item without a name', async done => {
		expect.assertions(1)
		const item = await new Item()
		await expect( item.addItem('', 'a nice computer') )
			.rejects.toEqual( Error('missing item name'))
		done()
	})

	test('add an item without a description', async done => {
		expect.assertions(1)
		const item = await new Item()
		await expect( item.addItem('computer', '') )
			.rejects.toEqual( Error('missing item description'))
		done()
	})
})

describe('uploadPicture()', () => {
	// i need to use mock-fs for this test
})
