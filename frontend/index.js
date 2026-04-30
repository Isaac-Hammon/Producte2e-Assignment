document.addEventListener("DOMContentLoaded", () => {
	/* -------------------- STATE -------------------- */

	const productsList = document.querySelector('ul[name="products-list"]');
	const confirmation = document.getElementById("confirmation");

	const isLoggedIn = () =>
		!!localStorage.getItem("email") && !!localStorage.getItem("userId");

	const getUserId = () => Number(localStorage.getItem("userId"));
	const getEmail = () => localStorage.getItem("email");

	/* -------------------- AUTH UI -------------------- */

	const loginBtn = document.getElementById("login-btn");
	const signupBtn = document.getElementById("signup-btn");
	const logoutBtn = document.getElementById("logout-btn");

	function updateAuthUI() {
		const loggedIn = isLoggedIn();

		if (logoutBtn) logoutBtn.style.display = loggedIn ? "inline-block" : "none";
		if (loginBtn) loginBtn.style.display = loggedIn ? "none" : "inline-block";
		if (signupBtn) signupBtn.style.display = loggedIn ? "none" : "inline-block";
	}

	updateAuthUI();

	logoutBtn?.addEventListener("click", () => {
		localStorage.clear();
		location.reload();
	});

	/* -------------------- WELCOME -------------------- */

	const welcomeEl = document.getElementById("welcome-message");

	function updateWelcomeMessage() {
		if (!welcomeEl) return;
		welcomeEl.textContent = isLoggedIn() ? `Welcome, ${getEmail()}` : "Welcome, Guest";
	}

	updateWelcomeMessage();

	/* -------------------- RECEIPT -------------------- */

	function showReceipt(product, quantity) {
		const receiptBox = document.getElementById("receipt");
		if (!receiptBox) return;

		const total = Number(product.price) * quantity;

		receiptBox.style.display = "block";
		receiptBox.innerHTML = `
			<h3>🧾 Purchase Receipt</h3>
			<p>Product: ${product.name}</p>
			<p>Qty: ${quantity}</p>
			<p>Total: $${total.toFixed(2)}</p>
		`;
	}

	/* -------------------- SELLER ORDERS -------------------- */

	let sellerOrdersBox = document.getElementById("seller-orders");

	if (!sellerOrdersBox) {
		sellerOrdersBox = document.createElement("div");
		sellerOrdersBox.id = "seller-orders";
		document.body.appendChild(sellerOrdersBox);
	}

	async function loadSellerOrders() {
		if (!isLoggedIn()) return;

		try {
			const res = await fetch("http://localhost:5013/seller/orders", {
				headers: { "X-User-Email": getEmail() },
			});

			if (!res.ok) {
				sellerOrdersBox.innerHTML = "";
				return;
			}

			const data = await res.json();

			sellerOrdersBox.innerHTML = `
				<h3>Your Product Sales</h3>
				<ul>
					${data.orders
						.map(
							(o) => `
							<li>
								Product: ${o.productName} |
								Qty: ${o.quantity} |
								Revenue: $${Number(o.revenue).toFixed(2)}
							</li>
						`,
						)
						.join("")}
				</ul>
				<p><strong>Total Revenue:</strong> $${Number(data.totalRevenue).toFixed(2)}</p>
			`;
		} catch {
			sellerOrdersBox.innerHTML = "";
		}
	}

	/* -------------------- MY ORDERS -------------------- */

	let myOrdersBox = document.getElementById("my-orders");

	if (!myOrdersBox) {
		myOrdersBox = document.createElement("div");
		myOrdersBox.id = "my-orders";
		document.body.appendChild(myOrdersBox);
	}

	async function loadMyOrders() {
		if (!isLoggedIn()) return;

		try {
			const res = await fetch("http://localhost:5013/my/orders", {
				headers: { "X-User-Email": getEmail() },
			});

			if (!res.ok) {
				myOrdersBox.innerHTML = "";
				return;
			}

			const data = await res.json();

			myOrdersBox.innerHTML = `
				<h3>Your Orders</h3>
				<ul>
					${data.orders
						.map(
							(o) => `
							<li>
								Product: ${o.productName} |
								Qty: ${o.quantity} |
								Total: $${Number(o.total).toFixed(2)}
							</li>
						`,
						)
						.join("")}
				</ul>
				<p><strong>Total Spent:</strong> $${Number(data.totalSpent).toFixed(2)}</p>
			`;
		} catch {
			myOrdersBox.innerHTML = "";
		}
	}

	/* -------------------- LOAD PRODUCTS -------------------- */

	async function loadProducts() {
		const res = await fetch("http://localhost:5013/products");
		const products = await res.json();

		productsList.innerHTML = "";

		const userId = getUserId();
		const email = getEmail();

		for (const product of products) {
			const li = document.createElement("li");

			li.textContent = `Name: ${product.name}, Price: $${Number(product.price).toFixed(
				2,
			)}, Inventory: ${product.inventoryCount} `;

			/* ---------------- OWNER ---------------- */
			if (product.userId === userId) {
				const editBtn = document.createElement("button");
				editBtn.textContent = "Edit";

				editBtn.onclick = async () => {
					const newName = prompt("New name:", product.name);
					const newPrice = prompt("New price:", product.price);
					const newInventory = prompt("New inventory:", product.inventoryCount);

					if (!newName || !newPrice || !newInventory) return;

					const res = await fetch(`http://localhost:5013/products/${product.id}`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							"X-User-Email": email,
						},
						body: JSON.stringify({
							name: newName,
							price: Number(newPrice),
							inventoryCount: Number(newInventory),
						}),
					});

					confirmation.style.display = "block";
					confirmation.textContent = res.ok ? "updated" : "error";

					if (res.ok) {
						loadProducts();
						loadSellerOrders();
						loadMyOrders();
					}
				};

				const deleteBtn = document.createElement("button");
				deleteBtn.textContent = "Delete";

				deleteBtn.onclick = async () => {
					const res = await fetch(`http://localhost:5013/products/${product.id}`, {
						method: "DELETE",
						headers: { "X-User-Email": email },
					});

					confirmation.style.display = "block";
					confirmation.textContent = res.ok ? "deleted" : "error";

					if (res.ok) {
						loadProducts();
						loadSellerOrders();
						loadMyOrders();
					}
				};

				li.appendChild(editBtn);
				li.appendChild(deleteBtn);
			} else {
				/* ---------------- BUYER ---------------- */
				const qtyInput = document.createElement("input");
				qtyInput.type = "number";

				const btn = document.createElement("button");
				btn.textContent = "Purchase";

				btn.onclick = async () => {
					if (!isLoggedIn()) {
						confirmation.style.display = "block";
						confirmation.textContent =
							"You must be logged into an account to purchase a product";
						return;
					}

					const qty = Number(qtyInput.value);

					if (!qty || qty <= 0 || qty > product.inventoryCount) {
						confirmation.style.display = "block";
						confirmation.textContent = "error";
						return;
					}

					const res = await fetch("http://localhost:5013/purchases", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-User-Email": email,
						},
						body: JSON.stringify({
							productId: product.id,
							quantity: qty,
						}),
					});

					confirmation.style.display = "block";

					if (res.ok) {
						showReceipt(product, qty);
						loadProducts();
						loadSellerOrders();
						loadMyOrders();
						return;
					}

					confirmation.textContent = "error";
				};

				li.appendChild(qtyInput);
				li.appendChild(btn);
			}

			productsList.appendChild(li);
		}

		// IMPORTANT FIX (this is what brought your sections back)
		loadSellerOrders();
		loadMyOrders();
	}

	loadProducts();

	/* -------------------- CREATE PRODUCT -------------------- */

	const form = document.querySelector('form[name="product-creation"]');

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const formData = new FormData(form);

		const name = formData.get("name");
		const price = formData.get("price");
		const inventoryCount = formData.get("inventoryCount");

		if (!name || !price || !inventoryCount) {
			confirmation.style.display = "block";
			confirmation.textContent = "You must fill out all fields before creating a product";
			return;
		}

		const res = await fetch("http://localhost:5013/products", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-User-Email": getEmail(),
			},
			body: JSON.stringify({
				name,
				price: Number(price),
				inventoryCount: Number(inventoryCount),
			}),
		});

		confirmation.style.display = "block";

		if (res.ok) {
			confirmation.textContent = "success";
			loadProducts();
			loadSellerOrders();
			loadMyOrders();
			return;
		}

		if (res.status === 401) {
			confirmation.textContent =
				"You must be logged into an account to create a product.";
			return;
		}

		confirmation.textContent = "error";
	});
});
