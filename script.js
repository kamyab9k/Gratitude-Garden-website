const form = document.getElementById("waitlist-form");

const successMessage =
  document.getElementById("success-message");

const errorMessage =
  document.getElementById("error-message");


form.addEventListener("submit", async function (event) {

  event.preventDefault();

  const submitButton =
    form.querySelector("button");

  const originalText =
    submitButton.innerHTML;


  submitButton.disabled = true;

  submitButton.innerHTML =
    "Joining...";


  const formData =
    new FormData(form);


  try {

    const response = await fetch(
      form.action,
      {
        method: "POST",

        body: formData,

        headers: {
          "Accept": "application/json"
        }
      }
    );


    if (response.ok) {

      form.reset();

      successMessage.style.display =
        "block";

      errorMessage.style.display =
        "none";

      submitButton.innerHTML =
        "You're on the list ♡";

    } else {

      throw new Error(
        "Submission failed"
      );

    }

  } catch (error) {

    successMessage.style.display =
      "none";

    errorMessage.style.display =
      "block";

    submitButton.innerHTML =
      originalText;

  }


  setTimeout(() => {

    submitButton.disabled = false;

  }, 3000);

});
