(function () {
  'use strict';

  // Mobile nav (burger menu) - runs on all pages
  const navBar = document.querySelector('.nav-bar');
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  const backdrop = document.querySelector('.nav-backdrop');
  const navLinksItems = document.querySelectorAll('.nav-links a');

  function closeNav() {
    if (navBar && navBar.classList.contains('nav-active')) {
      navBar.classList.remove('nav-active');
      document.body.classList.remove('no-scroll');
      if (burger) {
        burger.classList.remove('toggle');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
      }
      if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
    }
  }

  function openNav() {
    if (navBar) {
      navBar.classList.add('nav-active');
      document.body.classList.add('no-scroll');
      if (burger) {
        burger.classList.add('toggle');
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Close menu');
      }
      if (backdrop) backdrop.setAttribute('aria-hidden', 'false');
    }
  }

  function toggleNav() {
    if (navBar && navBar.classList.contains('nav-active')) {
      closeNav();
    } else {
      openNav();
    }
  }

  if (burger && navBar) {
    burger.addEventListener('click', toggleNav);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeNav);
  }

  navLinksItems.forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navBar && navBar.classList.contains('nav-active')) {
      closeNav();
    }
  });

  // Swiper - only on index (when .mySwiper exists and Swiper is defined)
  if (typeof Swiper !== 'undefined' && document.querySelector('.mySwiper')) {
    new Swiper('.mySwiper', {
      slidesPerView: 1,
      spaceBetween: 10,
      loop: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        type: 'fraction'
      },
      autoplay: {
        delay: 3000,
        disableOnInteraction: false
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      effect: 'creative',
      creativeEffect: {
        prev: {
          shadow: true,
          translate: [0, -400]
        },
        next: {
          translate: ['100%', 0, 0]
        }
      }
    });
  }

  // Smooth scroll for hash links
  ['#main-content', '#footer', '#youtube', '#map', '#leaders_church'].forEach(function (selector) {
    document.querySelectorAll('a[href^="' + selector + '"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
        }
      });
    });
  });

  // Scroll-to-top button
  var myBtn = document.getElementById('myBtn');
  if (myBtn) {
    window.onscroll = function () {
      myBtn.style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? 'block' : 'none';
    };
  }

  window.topFunction = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
})();
