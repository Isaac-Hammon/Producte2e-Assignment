const getResponse = await fetch("http://localhost:5013/products");
const productsJson = await getResponse.json();

console.log("productsJson");
console.log(productsJson);

const productsList = document.querySelector("ul[name=products-list]");

for (let i = 0; i < productsJson.length; i++) {
	const product = productsJson[i];

	const name = product.name;
	const price = product.price;
	const inventoryCount = product.inventoryCount;

	const newLi = document.createElement("li");
	newLi.innerText = `Name: ${name}, Price: $${Number(price).toFixed(2)}, Inventory: ${inventoryCount}`;

	productsList.appendChild(newLi);
}

const form = document.querySelector("form[name=product-creation]");

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const formData = new FormData(form);

	const body = {
		name: formData.get("name"),
		price: parseFloat(formData.get("price")),
		inventoryCount: parseInt(formData.get("inventoryCount")),
	};

	console.log("formData");
	console.log(body);

	await fetch("http://localhost:5013/products", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	// show confirmation message (needed for Cypress)
	const confirmation = document.getElementById("confirmation");
	if (confirmation) {
		confirmation.style.display = "block";
	}

	const purchaseForm = document.querySelector('form[name="product-purchase"]');

	purchaseForm.addEventListener("submit", async (e) => {
		e.preventDefault();

		const formData = new FormData(purchaseForm);

		const body = {
			productId: 1, // minimal assumption for now
			quantity: parseInt(formData.get("quantity")),
		};

		console.log("purchaseData");
		console.log(body);

		const response = await fetch("http://localhost:5013/purchases", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		// required for Cypress visibility
		const confirmation = document.getElementById("confirmation");

		if (confirmation) {
			confirmation.style.display = "block";

			// show backend message (important for validation tests)
			confirmation.innerText = await response.text();
		}
	});

	location.reload();
});
