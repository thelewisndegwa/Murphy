const navSlide = () => {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav-links');
  const navLinks = document.querySelectorAll('.nav-links li');

  burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('nav-active');
      burger.setAttribute('aria-expanded', isOpen);
      burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      
      document.body.classList.toggle('no-scroll', isOpen);

      navLinks.forEach((link, index) => {
          if (link.style.animation) {
              link.style.animation = '';
          } else {
              link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
          }
      });

      burger.classList.toggle('toggle', isOpen);
  });
}

// Call the navSlide function to initialize the navigation menu behavior
navSlide();





var swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 10,
    loop: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      type:"fractiion",
    },
    autoplay:{
        delay:3000,
        disableOnInteraction:false,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    effect:"creative",
    creativeEffect: {
        prev:{
            shadow:true,
            translate: [0,0-400],
        },
        next:{
            translate: ["100%",0,0]
        },
    },
  });

// Smooth scroll to the introduction section when clicking "Get Started"
document.querySelectorAll('a[href^="#main-content"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
  
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth' // Add smooth scroll behavior
        });
      }
    });
  });
  

  document.querySelectorAll('a[href^="#youtube"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
  
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth' // Add smooth scroll behavior
        });
      }
    });
  });

  document.querySelectorAll('a[href^="#map"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
  
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth' // Add smooth scroll behavior
        });
      }
    });
  });

  document.querySelectorAll('a[href^="#footer"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
  
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth' // Add smooth scroll behavior
        });
      }
    });
  });

  document.querySelectorAll('a[href^="#leaders_church"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
  
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth' // Add smooth scroll behavior
        });
      }
    });
  });




// Get the button:
let mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {
  scrollFunction();
};

function scrollFunction() {
  let mybutton = document.getElementById("myBtn");
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      mybutton.style.display = "block";
  } else {
      mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document smoothly
function topFunction() {
  if (window.scrollTo) { // Check if the browser supports smooth scrolling
      window.scrollTo({
          top: 0,
          behavior: 'smooth' // Add smooth behavior
      });
  } else { // For browsers that don't support smooth scrolling, scroll instantly
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE, and Opera
  }
}
