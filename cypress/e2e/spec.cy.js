const { faker } = require("@faker-js/faker");

describe("products", () => {
	it("lists products", () => {
		cy.visit("http://localhost:5173");

		cy.get("h1").should("have.text", "Products");

		cy.get('ul[name="products-list"]').should("be.visible");
	});

	it("creates products", () => {
		cy.visit("http://localhost:5173");

		const name = faker.commerce.productName();
		const price = faker.number.int({ min: 0, max: 100 });

		cy.get("form").should("be.visible");
		cy.get('form input[name="name"]').should("be.visible").type(name);
		cy.get('form input[name="price"]').should("be.visible").type(price);

		cy.get('form button[type="submit"]')
			.should("be.visible")
			.and("have.text", "Create Product")
			.click();

		cy.get('ul[name="products-list"] li:last')
			.should("be.visible")
			.and("have.text", `Name: ${name}, Price: ${price}`);

		cy.url().should("eq", "http://localhost:5173/");
	});
});
