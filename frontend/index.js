const getResponse = await fetch("http://localhost:5173/products");
const productsJson = await getResponse.json();

console.log("productsJson");
console.log(productsJson);

const productsList = document.querySelector("ul[name=products-list]");

for (let i = 0; i < productsJson.length; i++) {
	const product = productsJson[i];

	const name = product.name;
	const price = product.price;

	const newLi = document.createElement("li");
	newLi.innerText = `Name: ${name}, Price: ${price}`;

	productsList.appendChild(newLi);
}
