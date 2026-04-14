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

	location.reload();
});
