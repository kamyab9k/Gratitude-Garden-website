/* =========================================================
   GRATITUDE GARDEN
   Scroll animations
========================================================= */


/* =========================================================
   SCROLL STORY
========================================================= */

const storyStages =
  document.querySelectorAll(
    ".story-stage"
  );


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
