const form = document.getElementById("waitlist-form");
const emailInput = document.getElementById("email");
const successMessage = document.getElementById("success-message");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = emailInput.value.trim();

  if (!email) {
    return;
  }

  // Temporary version:
  // We'll connect this to a real waitlist service later.

  console.log("Waitlist signup:", email);

  form.reset();

  successMessage.style.display = "block";
});