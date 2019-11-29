
'use strict'

const General = require('../modules/generalFunctions.js')

// this function is used to remove arrays within other arrays
// the function is used to remove arrays from the carts.json
// example array of carts:
// "abbas": [
// 	{
// 		"size": "13-inch",
// 		"color": "Gold",
// 		"id": "2",
// 		"name": "Apple MacBook Air",
// 		"price": "45999",
// 		"imageSRC": "item_images/2/Apple MacBook Air0.jpeg"
// 	},
// 	{
// 		"size": "15-inch",
// 		"color": "white",
// 		"id": "1",
// 		"name": "Apple MacBook Pro",
// 		"price": "59999",
// 		"imageSRC": "item_images/1/Apple MacBook Pro0.jpeg"
// 	},
// 	{
// 		"size": "28-inch",
// 		"color": "white",
// 		"id": "3",
// 		"name": "Apple iMac Pro",
// 		"price": "169999",
// 		"imageSRC": "item_images/3/Apple iMac Pro1.jpeg"
// 	}

describe('removeArrFromArr()', () => {
	test('remove the first array', async done => {
		//arrange
		const gen = new General()
		const arr1 = [{'user': 'Abbas', 'surname': 'Al-Amin'},
			{'user': 'Bob', 'surname': 'Jones'},
			{'user': 'John', 'surname': 'Smith'},
			{'user': 'Jim', 'surname': 'Parker'}]

		const arr2 = {'user': 'Abbas', 'surname': 'Al-Amin'}

		const expectedOutputArray = JSON.stringify([{'user': 'Bob', 'surname': 'Jones'},
			{'user': 'John', 'surname': 'Smith'},
			{'user': 'Jim', 'surname': 'Parker'}])
		// action and assert
		await expect( gen.removeArrFromArr(arr2, arr1)).resolves.toEqual(expectedOutputArray)
		done()
	})

	test('remove the an array from the middle', async done => {
		//arrange
		const gen = new General()
		const arr1 = [{'user': 'Abbas', 'surname': 'Al-Amin'},
			{'user': 'Bob', 'surname': 'Jones'},
			{'user': 'John', 'surname': 'Smith'},
			{'user': 'Jim', 'surname': 'Parker'}]

		const arr2 = {'user': 'Bob', 'surname': 'Jones'}

		const expectedOutputArray = JSON.stringify([{'user': 'Abbas', 'surname': 'Al-Amin'},
			{'user': 'John', 'surname': 'Smith'},
			{'user': 'Jim', 'surname': 'Parker'}])
		// action and assert
		await expect( gen.removeArrFromArr(arr2, arr1)).resolves.toEqual(expectedOutputArray)
		done()
	})

	test('remove the last array', async done => {
		//arrange
		const gen = new General()
		const arr1 = [{'user': 'Abbas', 'surname': 'Al-Amin'},
			{'user': 'Bob', 'surname': 'Jones'},
			{'user': 'John', 'surname': 'Smith'},
			{'user': 'Jim', 'surname': 'Parker'}]

		const arr2 = {'user': 'Jim', 'surname': 'Parker'}

		const expectedOutputArray = JSON.stringify([{'user': 'Abbas', 'surname': 'Al-Amin'},
			{'user': 'Bob', 'surname': 'Jones'},
			{'user': 'John', 'surname': 'Smith'}])
		// action and assert
		await expect( gen.removeArrFromArr(arr2, arr1)).resolves.toEqual(expectedOutputArray)
		done()
	})

	test('remove the only array', async done => {
		//arrange
		const gen = new General()
		const arr1 = [{'user': 'Abbas', 'surname': 'Al-Amin'}]

		const arr2 = {'user': 'Abbas', 'surname': 'Al-Amin'}

		const expectedOutputArray = JSON.stringify([])
		// action and assert
		await expect( gen.removeArrFromArr(arr2, arr1)).resolves.toEqual(expectedOutputArray)
		done()
	})

	test('remove an array that doesnt exist', async done => {
		//arrange
		const gen = new General()
		const arr1 = [{'user': 'Abbas', 'surname': 'Al-Amin'}]

		const arr2 = {'user': 'Bob', 'surname': 'Jones'}

		const expectedOutputArray = JSON.stringify(arr1)
		// action and assert
		await expect( gen.removeArrFromArr(arr2, arr1)).resolves.toEqual(expectedOutputArray)
		done()
	})
})
