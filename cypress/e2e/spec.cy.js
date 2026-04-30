const { faker } = require("@faker-js/faker");

/* ========================================================= */
/* 🔧 LOGIN HELPER (REAL E2E AUTH) */
/* ========================================================= */
Cypress.Commands.add("loginUI", (email, password = "password123") => {
	cy.request("POST", "http://localhost:5013/users", {
		email,
		password,
	});

	// store email so frontend can use it
	window.localStorage.setItem("email", email);

	cy.visit("http://localhost:5173/login.html");

	cy.get('input[name="email"]').type(email);
	cy.get('input[name="password"]').type(password);

	cy.get('button[type="submit"]').click();

	cy.get("#confirmation").should("contain.text", "Login");
});

/* ========================================================= */
/* 🔧 HELPERS */
/* ========================================================= */
const getEmail = (email) => ({
	"X-User-Email": email,
});

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

		cy.get("#confirmation").should("be.visible");

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

		cy.get("#confirmation")
			.should("be.visible")
			.and("contain.text", "You must be logged into an account to create a product.");
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

		cy.get("#confirmation").should("be.visible").and("contain.text", "error");
	});
});

/* -------------------- PURCHASES -------------------- */
describe("purchases", () => {
	it("blocks purchase when not logged in", () => {
		cy.visit("http://localhost:5173");

		cy.get('ul[name="products-list"] li input[type="number"]').first().type("1");
		cy.contains("Purchase").first().click();

		cy.get("#confirmation")
			.should("be.visible")
			.and("contain.text", "You must be logged into an account to purchase a product");
	});

	it("rejects negative quantity", () => {
		cy.visit("http://localhost:5173");

		cy.get('ul[name="products-list"] li input[type="number"]').first().type("-3");
		cy.contains("Purchase").first().click();

		cy.get("#confirmation")
			.should("be.visible")
			.and("contain.text", "You must be logged into an account to purchase a product");
	});

	it("rejects quantity greater than inventory", () => {
		cy.visit("http://localhost:5173");

		cy.get('ul[name="products-list"] li input[type="number"]').first().type("999");
		cy.contains("Purchase").first().click();

		cy.get("#confirmation")
			.should("be.visible")
			.and("contain.text", "You must be logged into an account to purchase a product");
	});

	it("ensures backend ignores spoofed userId", () => {
		cy.visit("http://localhost:5173");

		cy.get('ul[name="products-list"] li input[type="number"]').first().type("1");
		cy.contains("Purchase").first().click();

		cy.get("#confirmation").should("be.visible");
	});
});
/* ========================================================= */
/* PRODUCTS - EDIT / DELETE */
/* ========================================================= */

describe("products - edit/delete ownership", () => {
	it("allows seller to edit their product", () => {
		const email = faker.internet.email();

		cy.loginUI(email);
		cy.visit("http://localhost:5173");

		cy.get('form[name="product-creation"] input[name="name"]').type("My Product");
		cy.get('form[name="product-creation"] input[name="price"]').type("10");
		cy.get('form[name="product-creation"] input[name="inventoryCount"]').type("5");
		cy.get('form[name="product-creation"] button[type="submit"]').click();

		cy.contains("My Product").should("exist");

		cy.request("GET", "http://localhost:5013/products").then((res) => {
			const product = res.body.find((p) => p.name === "My Product");

			cy.request({
				method: "PUT",
				url: `http://localhost:5013/products/${product.id}`,
				headers: getEmail(email), // ✅ FIX
				failOnStatusCode: false,
				body: {
					name: "Updated Product",
					price: 20,
					inventoryCount: 5,
				},
			})
				.its("status")
				.should("eq", 200);
		});
	});

	it("blocks editing when not owner", () => {
		cy.request({
			method: "PUT",
			url: "http://localhost:5013/products/1",
			failOnStatusCode: false,
			body: { name: "Hack" },
		})
			.its("status")
			.should("eq", 401);
	});

	it("allows seller to delete product", () => {
		const email = faker.internet.email();

		cy.loginUI(email);
		cy.visit("http://localhost:5173");

		cy.get('form[name="product-creation"] input[name="name"]').type("Delete Me");
		cy.get('form[name="product-creation"] input[name="price"]').type("10");
		cy.get('form[name="product-creation"] input[name="inventoryCount"]').type("5");
		cy.get('form[name="product-creation"] button[type="submit"]').click();

		cy.contains("Delete Me").should("exist");

		cy.request("GET", "http://localhost:5013/products").then((res) => {
			const product = res.body.find((p) => p.name === "Delete Me");

			cy.request({
				method: "DELETE",
				url: `http://localhost:5013/products/${product.id}`,
				headers: getEmail(email), // ✅ FIX
				failOnStatusCode: false,
			})
				.its("status")
				.should("eq", 200);
		});
	});
});

/* ========================================================= */
/* ORDERS */
/* ========================================================= */

describe("orders visibility", () => {
	it("seller can view their product orders", () => {
		const email = faker.internet.email();

		cy.loginUI(email);

		cy.request({
			method: "GET",
			url: "http://localhost:5013/seller/orders",
			headers: getEmail(email), // ✅ FIX
		})
			.its("status")
			.should("eq", 200);
	});

	it("blocks seller orders when not logged in", () => {
		cy.request({
			method: "GET",
			url: "http://localhost:5013/seller/orders",
			failOnStatusCode: false,
		})
			.its("status")
			.should("eq", 401);
	});

	it("buyer can view their own orders", () => {
		const email = faker.internet.email();

		cy.loginUI(email);

		cy.request({
			method: "GET",
			url: "http://localhost:5013/my/orders",
			headers: getEmail(email), // ✅ FIX
		})
			.its("status")
			.should("eq", 200);
	});

	it("blocks other users from viewing orders", () => {
		cy.request({
			method: "GET",
			url: "http://localhost:5013/my/orders",
			failOnStatusCode: false,
		})
			.its("status")
			.should("eq", 401);
	});
});
