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

		cy.contains("Product Created");

		cy.get('ul[name="products-list"] li:last')
			.should("be.visible")
			.and(
				"have.text",
				`Name: ${name}, Price: $${Number(price).toFixed(2)}, Inventory: ${inventoryCount}`,
			);

		cy.url().should("eq", "http://localhost:5173/");
	});
});

describe("users", () => {
	it("shows user form fields", () => {
		cy.visit("http://localhost:5173/registration.html");

		cy.get('input[name="email"]').should("be.visible").and("have.attr", "required");

		cy.get('input[name="password"]').should("be.visible").and("have.attr", "required");
	});

	it("creates user", () => {
		cy.visit("http://localhost:5173/registration.html");

		const email = faker.internet.email();
		const password = faker.internet.password();

		cy.get('input[name="email"]').type(email);
		cy.get('input[name="password"]').type(password);

		cy.get('button[type="submit"]').click();

		cy.get("#confirmation").should("be.visible").and("contain.text", "Success");
	});

	it("shows error when duplicate email is used", () => {
		cy.visit("http://localhost:5173/registration.html");

		const email = faker.internet.email();
		const password = faker.internet.password();

		cy.get('input[name="email"]').type(email);
		cy.get('input[name="password"]').type(password);

		cy.get('button[type="submit"]').click();

		cy.get("#confirmation").should("be.visible");

		cy.get('input[name="email"]').clear().type(email);
		cy.get('input[name="password"]').clear().type(password);

		cy.get('button[type="submit"]').click();

		cy.get("#confirmation").should("be.visible").and("contain.text", "Error");
	});
});
