(function () {
  'use strict';

  var navBar = document.querySelector('.nav-bar');
  var burger = document.querySelector('.burger');
  var backdrop = document.querySelector('.nav-backdrop');
  var navLinksItems = document.querySelectorAll('.nav-links a');

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

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href || href === '#') return;
    link.addEventListener('click', function (e) {
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeNav();
      }
    });
  });

  var myBtn = document.getElementById('myBtn');
  if (myBtn) {
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      myBtn.style.display = y > 20 ? 'block' : 'none';
    }, { passive: true });
  }

  window.topFunction = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
})();
