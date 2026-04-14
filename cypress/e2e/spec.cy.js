const { faker } = require("@faker-js/faker");

describe("products", () => {
	it("lists products", () => {
		cy.visit("http://localhost:5173");

		cy.get("h1").should("have.text", "Products:");

		cy.get('ul[name="products-list"]').should("be.visible");
	});

	it("creates product", () => {
		cy.visit("http://localhost:5173");

		const name = faker.commerce.productName();
		const price = faker.commerce.price({ min: 1, max: 1000, precision: 0.01 });
		const inventoryCount = faker.number.int({ min: 0, max: 100 });

		cy.get("form").should("be.visible");

		cy.get('form input[name="name"]').should("be.visible").type(name);

		cy.get('form input[name="price"]').should("be.visible").type(price.toString());

		cy.get('form input[name="inventoryCount"]')
			.should("be.visible")
			.type(inventoryCount.toString());

		cy.get('form button[type="submit"]').should("be.visible").click();

		// confirmation message (rubric requirement)
		cy.contains("Product Created");

		// verify product appears in list
		cy.get('ul[name="products-list"] li:last')
			.should("be.visible")
			.and(
				"have.text",
				`Name: ${name}, Price: $${Number(price).toFixed(2)}, Inventory: ${inventoryCount}`,
			);

		cy.url().should("eq", "http://localhost:5173/");
	});
});
