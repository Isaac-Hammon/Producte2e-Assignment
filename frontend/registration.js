const form = document.querySelector('form[name="user-creation"]');
const confirmation = document.getElementById("confirmation");

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const email = form.email.value;
	const password = form.password.value;

	try {
		const response = await fetch("http://localhost:5013/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		const data = await response.json();

		confirmation.style.display = "block";

		if (!response.ok) {
			confirmation.textContent = "Error: " + (data.message || "Email already exists");
		} else {
			confirmation.textContent = "Success! User created with ID: " + data.id;
		}
	} catch (error) {
		confirmation.style.display = "block";
		confirmation.textContent = "Error: Could not connect to server";
	}
});
