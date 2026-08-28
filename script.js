/* =========================================================
   GRATITUDE GARDEN
   Scroll animations + waitlist
========================================================= */


/* =========================================================
   SCROLL STORY ANIMATION
========================================================= */

const storyStages =
  document.querySelectorAll(".story-stage");


const observer =
  new IntersectionObserver(

    (entries) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add(
            "visible"
          );

        }

      });

    },

    {
      threshold: 0.30
    }

  );


storyStages.forEach((stage) => {

  observer.observe(stage);

});



/* =========================================================
   WAITLIST FORM
========================================================= */

const form =
  document.getElementById(
    "waitlist-form"
  );


const successMessage =
  document.getElementById(
    "success-message"
  );


const errorMessage =
  document.getElementById(
    "error-message"
  );


form.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    const button =
      form.querySelector("button");


    const originalButtonText =
      button.innerHTML;


    button.disabled = true;

    button.innerHTML =
      "Joining...";


    const formData =
      new FormData(form);


    try {

      const response =
        await fetch(

          form.action,

          {
            method: "POST",

            body: formData,

            headers: {
              "Accept":
                "application/json"
            }
          }

        );


      if (!response.ok) {

        throw new Error(
          "Form submission failed"
        );

      }


      /* Success */

      form.reset();


      successMessage.style.display =
        "block";


      errorMessage.style.display =
        "none";


      button.innerHTML =
        "You're on the list ♡";


    } catch (error) {


      /* Error */

      successMessage.style.display =
        "none";


      errorMessage.style.display =
        "block";


      button.innerHTML =
        originalButtonText;

    }


    setTimeout(() => {

      button.disabled = false;

    }, 3000);


  }
);
