document.addEventListener("DOMContentLoaded", () => {
	/* -------------------- PRODUCTS LOAD -------------------- */

	const productsList = document.querySelector("ul[name=products-list]");
	const confirmation = document.getElementById("confirmation");

	async function loadProducts() {
		const res = await fetch("http://localhost:5013/products");
		const products = await res.json();

		productsList.innerHTML = "";

		for (const product of products) {
			const li = document.createElement("li");
			li.innerText = `Name: ${product.name}, Price: $${Number(product.price).toFixed(2)}, Inventory: ${product.inventoryCount}`;
			productsList.appendChild(li);
		}
	}

	loadProducts();

	/* -------------------- PRODUCT CREATION -------------------- */

	const form = document.querySelector("form[name=product-creation]");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const formData = new FormData(form);

		const body = {
			name: formData.get("name"),
			price: parseFloat(formData.get("price")),
			inventoryCount: parseInt(formData.get("inventoryCount")),
		};

		const response = await fetch("http://localhost:5013/products", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		confirmation.textContent = response.ok ? "success" : "error";
		confirmation.style.display = "block";
		confirmation.style.minHeight = "20px";

		if (response.ok) {
			await loadProducts();
		}
	});

	/* -------------------- PURCHASE FORM -------------------- */

	const purchaseForm = document.querySelector('form[name="product-purchase"]');

	if (purchaseForm) {
		purchaseForm.addEventListener("submit", async (e) => {
			e.preventDefault();

			const formData = new FormData(purchaseForm);

			const body = {
				productId: 1,
				quantity: parseInt(formData.get("quantity")),
			};

			const response = await fetch("http://localhost:5013/purchases", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			// ✅ always reset visual state
			confirmation.style.display = "block";

			// ✅ deterministic output
			confirmation.textContent = response.ok ? "success" : "error";
		});
	}
});
