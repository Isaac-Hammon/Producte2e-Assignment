const form = document.querySelector('form[name="user-creation"]');
const confirmation = document.getElementById("confirmation");

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const email = form.email.value.trim();
	const password = form.password.value;

	try {
		const response = await fetch("http://localhost:5013/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		confirmation.style.display = "block";

		const data = await response.json().catch(() => null);

		if (!response.ok || !data) {
			confirmation.textContent = "error";
			return;
		}

		/* ---------------- STORE SESSION ---------------- */
		localStorage.setItem("userId", String(data.id));
		localStorage.setItem("email", data.email);

		// optional but useful for UI checks
		localStorage.setItem("isLoggedIn", "true");

		/* ---------------- UI MESSAGE ---------------- */
		confirmation.textContent = `Login successful. Welcome, ${data.email}!`;

		/* ---------------- REDIRECT ---------------- */
		setTimeout(() => {
			window.location.href = "index.html";
		}, 600);
	} catch (error) {
		confirmation.style.display = "block";
		confirmation.textContent = "error";
	}
});
