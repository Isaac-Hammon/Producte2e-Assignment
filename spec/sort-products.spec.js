const sortProducts = require("../util/sort-products-test");

describe("sortProducts", () => {
	const unsortedProducts = [
		{ name: "Laptop", price: 1200.99, inventoryCount: 10 },
		{ name: "Headphones", price: 199.5, inventoryCount: 5 },
		{ name: "Keyboard", price: 89.99, inventoryCount: 20 },
	];

	it("sorts products by name alphabetically", () => {
		const expectedSorting = [
			{ name: "Headphones", price: 199.5, inventoryCount: 5 },
			{ name: "Keyboard", price: 89.99, inventoryCount: 20 },
			{ name: "Laptop", price: 1200.99, inventoryCount: 10 },
		];

		const actualSorting = sortProducts(unsortedProducts, "nameAsc");

		expect(actualSorting).toEqual(expectedSorting);
	});

	it("sorts products by decreasing price", () => {
		const expectedSorting = [
			{ name: "Laptop", price: 1200.99, inventoryCount: 10 },
			{ name: "Headphones", price: 199.5, inventoryCount: 5 },
			{ name: "Keyboard", price: 89.99, inventoryCount: 20 },
		];

		const actualSorting = sortProducts(unsortedProducts, "priceDesc");

		expect(actualSorting).toEqual(expectedSorting);
	});

	it("sorts products by increasing price", () => {
		const expectedSorting = [
			{ name: "Keyboard", price: 89.99, inventoryCount: 20 },
			{ name: "Headphones", price: 199.5, inventoryCount: 5 },
			{ name: "Laptop", price: 1200.99, inventoryCount: 10 },
		];

		const actualSorting = sortProducts(unsortedProducts, "priceAsc");

		expect(actualSorting).toEqual(expectedSorting);
	});
});
