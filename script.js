/* =========================================================
   GRATITUDE GARDEN
   Scroll animations + waitlist
========================================================= */


/* =========================================================
   SCROLL ANIMATIONS
========================================================= */

const stages =
  document.querySelectorAll(".story-stage");


const stageObserver =
  new IntersectionObserver(

    (entries) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add("visible");

        }

      });

    },

    {
      threshold: 0.25
    }

  );


stages.forEach((stage) => {

  stageObserver.observe(stage);

});



/* =========================================================
   WAITLIST
========================================================= */

const form =
  document.getElementById("waitlist-form");

const successMessage =
  document.getElementById("success-message");

const errorMessage =
  document.getElementById("error-message");


form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const button =
      form.querySelector("button");


    const originalText =
      button.textContent;


    button.disabled = true;

    button.textContent =
      "Joining...";


    try {

      const response =
        await fetch(
          form.action,
          {
            method: "POST",

            body:
              new FormData(form),

            headers: {
              "Accept":
                "application/json"
            }
          }
        );


      if (!response.ok) {
        throw new Error("Failed");
      }


      form.reset();


      successMessage.style.display =
        "block";

      errorMessage.style.display =
        "none";


      button.textContent =
        "Joined ♡";


    } catch (error) {

      successMessage.style.display =
        "none";

      errorMessage.style.display =
        "block";


      button.textContent =
        originalText;

    }


    setTimeout(() => {

      button.disabled = false;

    }, 3000);

  }
);
