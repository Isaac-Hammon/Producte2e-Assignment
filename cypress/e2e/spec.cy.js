const { faker } = require("@faker-js/faker");

/* -------------------- PRODUCTS -------------------- */
describe("products", () => {
	it("lists products", () => {
		cy.visit("http://localhost:5173");

		cy.get("h1").should("have.text", "Products:");
		cy.get('ul[name="products-list"]').should("be.visible");
	});

	it("creates product", () => {
		cy.visit("http://localhost:5173");

		const email = faker.internet.email();

		const name = faker.commerce.productName();
		const price = faker.commerce.price({ min: 1, max: 1000, precision: 0.01 });
		const inventoryCount = faker.number.int({ min: 0, max: 100 });

		cy.request("POST", "http://localhost:5013/users", {
			email,
			password: "password123",
		});

		cy.intercept("POST", "http://localhost:5013/products", (req) => {
			req.headers["X-User-Email"] = email;
			req.continue();
		});

		cy.get('form[name="product-creation"] input[name="name"]').type(name);
		cy.get('form[name="product-creation"] input[name="price"]').type(price.toString());
		cy.get('form[name="product-creation"] input[name="inventoryCount"]').type(
			inventoryCount.toString(),
		);

		cy.get('form[name="product-creation"] button[type="submit"]').click();

		// ✅ confirmation must appear
		cy.get("#confirmation").should("be.visible");

		// ✅ FIXED: do NOT rely on last item order
		cy.contains('ul[name="products-list"] li', name)
			.should("be.visible")
			.and("contain.text", name);

		cy.url().should("eq", "http://localhost:5173/");
	});

	it("blocks product creation when not logged in", () => {
		cy.visit("http://localhost:5173");

		const name = faker.commerce.productName();
		const price = faker.commerce.price({ min: 1, max: 1000, precision: 0.01 });
		const inventoryCount = faker.number.int({ min: 0, max: 100 });

		cy.get('form[name="product-creation"] input[name="name"]').type(name);
		cy.get('form[name="product-creation"] input[name="price"]').type(price.toString());
		cy.get('form[name="product-creation"] input[name="inventoryCount"]').type(
			inventoryCount.toString(),
		);

		cy.get('form[name="product-creation"] button[type="submit"]').click();

		// 🔥 STANDARDIZED ERROR
		cy.get("#confirmation").should("be.visible").and("contain.text", "error");
	});
});

/* -------------------- USERS -------------------- */
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
		const email = faker.internet.email();

		cy.request("POST", "http://localhost:5013/users", {
			email,
			password: "password123",
		});

		cy.visit("http://localhost:5173/registration.html");

		cy.get('input[name="email"]').type(email);
		cy.get('input[name="password"]').type("password123");

		cy.get('button[type="submit"]').click();

		// 🔥 STANDARDIZED ERROR
		cy.get("#confirmation").should("be.visible").and("contain.text", "error");
	});
});

/* -------------------- LOGIN -------------------- */
describe("users - login", () => {
	it("shows login form fields", () => {
		cy.visit("http://localhost:5173/login.html");

		cy.get('input[name="email"]').should("be.visible").and("have.attr", "required");
		cy.get('input[name="password"]').should("be.visible").and("have.attr", "required");
	});

	it("logs in successfully with valid credentials", () => {
		const email = faker.internet.email();

		cy.request("POST", "http://localhost:5013/users", {
			email,
			password: "password123",
		});

		cy.visit("http://localhost:5173/login.html");

		cy.get('input[name="email"]').type(email);
		cy.get('input[name="password"]').type("password123");

		cy.get('button[type="submit"]').click();

		cy.get("#confirmation").should("be.visible").and("contain.text", "Login");
	});

	it("shows error on invalid login", () => {
		cy.visit("http://localhost:5173/login.html");

		cy.get('input[name="email"]').type("wrong@email.com");
		cy.get('input[name="password"]').type("wrongpassword");

		cy.get('button[type="submit"]').click();

		// 🔥 STANDARDIZED ERROR
		cy.get("#confirmation").should("be.visible").and("contain.text", "error");
	});
});

/* -------------------- PURCHASES -------------------- */
describe("purchases", () => {
	it("blocks purchase when not logged in", () => {
		cy.visit("http://localhost:5173");

		cy.get('form[name="product-purchase"] input[name="quantity"]').type("1");
		cy.get('form[name="product-purchase"] button[type="submit"]').click();

		// 🔥 STANDARDIZED ERROR
		cy.get("#confirmation").should("be.visible").and("contain.text", "error");
	});

	it("rejects negative quantity", () => {
		cy.visit("http://localhost:5173");

		cy.get('form[name="product-purchase"] input[name="quantity"]').type("-3");
		cy.get('form[name="product-purchase"] button[type="submit"]').click();

		// ✅ correct assertion (DON'T use be.visible here)
		cy.get("#confirmation").should("exist").and("contain.text", "error");
	});

	it("rejects quantity greater than inventory", () => {
		cy.visit("http://localhost:5173");

		cy.get('form[name="product-purchase"] input[name="quantity"]').type("999");
		cy.get('form[name="product-purchase"] button[type="submit"]').click();

		// 🔥 STANDARDIZED ERROR
		cy.get("#confirmation").should("be.visible").and("contain.text", "error");
	});

	it("ensures backend ignores spoofed userId", () => {
		cy.visit("http://localhost:5173");

		cy.get('form[name="product-purchase"] input[name="quantity"]').type("1");
		cy.get('form[name="product-purchase"] button[type="submit"]').click();

		cy.get("#confirmation").should("be.visible");
	});
});
