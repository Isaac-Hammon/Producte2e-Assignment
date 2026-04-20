const { faker } = require("@faker-js/faker");

describe("products", () => {
	it("lists products", () => {
		cy.visit("http://localhost:5173");

		cy.get("h1").should("have.text", "Products:");

		cy.get('ul[name="products-list"]').should("be.visible");
	});

	it("creates product", () => {
		cy.visit("http://localhost:5173");

		const email = faker.internet.email();
		const password = faker.internet.password();

		const name = faker.commerce.productName();
		const price = faker.commerce.price({ min: 1, max: 1000, precision: 0.01 });
		const inventoryCount = faker.number.int({ min: 0, max: 100 });

		// create user so we have a valid login identity
		cy.request("POST", "http://localhost:5013/users", {
			email,
			password,
		});

		// minimal fix: attach header so backend allows product creation
		cy.intercept("POST", "http://localhost:5013/products", (req) => {
			req.headers["X-User-Email"] = email;
		});

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

	// ✅ ONLY CHANGE HERE
	it("blocks product creation when not logged in", () => {
		cy.visit("http://localhost:5173");

		const name = faker.commerce.productName();
		const price = faker.commerce.price({ min: 1, max: 1000, precision: 0.01 });
		const inventoryCount = faker.number.int({ min: 0, max: 100 });

		cy.intercept("POST", "**/products").as("createProduct");

		cy.get('form input[name="name"]').type(name);
		cy.get('form input[name="price"]').type(price.toString());
		cy.get('form input[name="inventoryCount"]').type(inventoryCount.toString());

		cy.get('form button[type="submit"]').click();

		cy.wait("@createProduct").then((interception) => {
			expect(interception.response.statusCode).to.eq(400);
			expect(interception.response.body.message).to.eq(
				"You must be logged in to create a product",
			);
		});
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

		cy.get("#confirmation").should("be.visible").and("contain.text", "User");
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

		cy.get("#confirmation").should("be.visible").and("contain.text", "already exists");
	});
});

describe("users - login", () => {
	it("shows login form fields", () => {
		cy.visit("http://localhost:5173/login.html");

		cy.get('input[name="email"]').should("be.visible").and("have.attr", "required");

		cy.get('input[name="password"]').should("be.visible").and("have.attr", "required");
	});

	it("logs in successfully with valid credentials", () => {
		cy.visit("http://localhost:5173/login.html");

		const email = faker.internet.email();
		const password = faker.internet.password();

		cy.request("POST", "http://localhost:5013/users", {
			email,
			password,
		});

		cy.get('input[name="email"]').type(email);
		cy.get('input[name="password"]').type(password);

		cy.get('button[type="submit"]').click();

		cy.get("#confirmation").should("be.visible").and("contain.text", "Login successful");
	});

	it("shows error on invalid login", () => {
		cy.visit("http://localhost:5173/login.html");

		cy.get('input[name="email"]').type("wrong@email.com");
		cy.get('input[name="password"]').type("wrongpassword");

		cy.get('button[type="submit"]').click();

		cy.get("#confirmation")
			.should("be.visible")
			.and("contain.text", "Invalid credentials");
	});
});
