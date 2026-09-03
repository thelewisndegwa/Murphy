(function () {
  'use strict';

  function formatKes(n) {
    return 'KES ' + Number(n || 0).toLocaleString('en-KE');
  }

  function formatEnds(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatEndsLong(iso) {
    if (!iso) return 'End date not set';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function statusLabel(status) {
    if (status === 'reserved') return 'Reserved';
    if (status === 'sold') return 'Sold';
    return 'Open';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderGrid(lots) {
    var grid = document.getElementById('auction-grid');
    if (!grid) return;

    if (!lots.length) {
      grid.innerHTML =
        '<p class="auction-empty">No auctions listed right now. Please check back soon or <a href="contact.html">contact us</a>.</p>';
      return;
    }

    grid.innerHTML = lots
      .map(function (lot) {
        var cta =
          lot.status === 'open'
            ? 'View &amp; bid'
            : 'View details';
        var ends = formatEnds(lot.endsAt);
        return (
          '<article class="auction-card">' +
            '<div class="auction-card__media">' +
              '<img src="' +
              escapeHtml(lot.photoPath) +
              '" alt="' +
              escapeHtml(lot.title) +
              '" class="auction-card__image" loading="lazy">' +
              '<span class="status-badge status-badge--' +
              escapeHtml(lot.status) +
              '">' +
              statusLabel(lot.status) +
              '</span>' +
            '</div>' +
            '<div class="auction-card__body">' +
              '<h3 class="auction-card__title"><a href="auction-item.html?id=' +
              lot.id +
              '">' +
              escapeHtml(lot.title) +
              '</a></h3>' +
              '<p class="auction-card__bid"><span>Current bid</span>' +
              formatKes(lot.currentBid) +
              '</p>' +
              (ends
                ? '<p class="auction-card__ends">Ends ' + escapeHtml(ends) + '</p>'
                : '<p class="auction-card__ends">&nbsp;</p>') +
              '<a href="auction-item.html?id=' +
              lot.id +
              '" class="auction-card__cta">' +
              cta +
              '</a>' +
            '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  function loadList() {
    var grid = document.getElementById('auction-grid');
    if (!grid) return;
    grid.innerHTML = '<p class="auction-empty">Loading auctions…</p>';

    fetch('/api/auctions', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (lots) {
        if (!Array.isArray(lots)) throw new Error('Invalid response');
        renderGrid(lots.filter(function (lot) { return lot.status !== 'sold'; }));
      })
      .catch(function (err) {
        console.error('Failed to load auctions:', err);
        grid.innerHTML =
          '<p class="auction-empty">Could not load auctions. Open the site at <strong>http://localhost:3000</strong> (with <code>npm start</code> running), not by opening the HTML file directly.</p>';
      });
  }

  function loadItem() {
    var titleEl = document.getElementById('item-title');
    if (!titleEl) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    if (!id) {
      titleEl.textContent = 'Lot not found';
      return;
    }

    fetch('/api/auctions/' + encodeURIComponent(id))
      .then(function (r) {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(function (lot) {
        document.getElementById('item-breadcrumb-name').textContent = lot.title;
        titleEl.textContent = lot.title;
        document.getElementById('item-description').textContent = lot.description;
        var img = document.getElementById('item-image');
        img.src = lot.photoPath;
        img.alt = lot.title;
        document.getElementById('item-current-bid').textContent =
          'Current bid: ' + formatKes(lot.currentBid);
        document.getElementById('item-ends').textContent =
          'Auction ends: ' + formatEndsLong(lot.endsAt);

        var badge = document.getElementById('item-status');
        if (badge) {
          badge.textContent = statusLabel(lot.status);
          badge.className =
            'status-badge status-badge--' + lot.status + ' status-badge--inline';
        }

        document.title = lot.title + ' | Murphy Merchants Auctioneers';

        var form = document.getElementById('bid-form');
        var closedNote = document.getElementById('bid-closed-note');
        var ack = document.getElementById('bid-ack');
        if (ack) ack.hidden = true;
        if (lot.status === 'open') {
          if (form) form.hidden = false;
          if (closedNote) closedNote.hidden = true;
        } else {
          if (form) form.hidden = true;
          if (closedNote) {
            closedNote.hidden = false;
            closedNote.textContent =
              lot.status === 'sold'
                ? 'This lot has been sold. Bidding is closed.'
                : 'This lot is reserved. Bidding is currently closed.';
          }
        }
      })
      .catch(function () {
        titleEl.textContent = 'Lot not found';
        document.getElementById('item-description').textContent =
          'This auction may have been removed.';
        var form = document.getElementById('bid-form');
        if (form) form.hidden = true;
      });
  }

  if (document.getElementById('auction-grid')) {
    loadList();
  }
  if (document.getElementById('item-title')) {
    loadItem();
  }

  var form = document.getElementById('bid-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('bid-message');
      var params = new URLSearchParams(window.location.search);
      var id = params.get('id');
      var submitBtn = form.querySelector('button[type="submit"]');
      if (!id) {
        if (msg) {
          msg.className = 'bid-form__message error';
          msg.textContent = 'Missing auction id.';
        }
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      fetch('/api/auctions/' + encodeURIComponent(id) + '/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('bid-name').value.trim(),
          phone: document.getElementById('bid-phone').value.trim(),
          amount: document.getElementById('bid-amount').value
        })
      })
        .then(function (r) {
          return r.json().then(function (d) {
            return { ok: r.ok, d: d };
          });
        })
        .then(function (res) {
          if (!res.ok) {
            if (msg) {
              msg.className = 'bid-form__message error';
              msg.textContent = res.d.error || 'Could not place bid';
            }
            return;
          }

          var amount = res.d.bid && res.d.bid.amount;
          var ack = document.getElementById('bid-ack');
          var ackText = document.getElementById('bid-ack-text');
          if (ack) {
            if (ackText) {
              ackText.textContent = amount
                ? 'Thank you. Your bid of ' + formatKes(amount) + ' has been recorded. We’ll contact you if you’re the highest bidder.'
                : 'Thank you. Your bid has been recorded. We’ll contact you if you’re the highest bidder.';
            }
            ack.hidden = false;
            ack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          if (msg) {
            msg.className = 'bid-form__message';
            msg.textContent = '';
          }
          if (res.d.auction) {
            document.getElementById('item-current-bid').textContent =
              'Current bid: ' + formatKes(res.d.auction.currentBid);
          }
          form.reset();
          form.hidden = true;
        })
        .catch(function () {
          if (msg) {
            msg.className = 'bid-form__message error';
            msg.textContent = 'Could not reach the server. Try again.';
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
