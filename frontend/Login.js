const form = document.querySelector('form[name="user-creation"]');
const confirmation = document.getElementById("confirmation");

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const email = form.email.value;
	const password = form.password.value;

	try {
		const response = await fetch("http://localhost:5013/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		const data = await response.json();

		confirmation.style.display = "block";

		if (!response.ok) {
			confirmation.textContent = "error";
		} else {
			localStorage.setItem("userId", data.id);
			confirmation.textContent = "Login successful";
		}
	} catch (error) {
		confirmation.style.display = "block";
		confirmation.textContent = "error";
	}
});
