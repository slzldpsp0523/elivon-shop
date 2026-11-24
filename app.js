/* ==========================================================================
   ÉLIVON — 쇼핑몰 UI 로직
   data.js(상품) · cart.js(장바구니 상태) · payment.js(결제) 를 연결합니다.
   ========================================================================== */

(function () {
  'use strict';

  var DATA = window.ELIVON_DATA || { PRODUCTS: [], CATEGORIES: [] };
  var CartLib = window.ELIVON_CART;
  var Pay = window.ElivonPay;

  var PRODUCTS = DATA.PRODUCTS;
  var PRODUCT_MAP = {};
  PRODUCTS.forEach(function (p) {
    PRODUCT_MAP[p.id] = p;
  });

  var CATEGORY_LABEL = {
    violin: '바이올린',
    cello: '첼로',
    bow: '활',
    accessories: '보조품'
  };

  var LAST_ORDER_KEY = 'elivon:lastOrder:v1';

  /* ── 유틸 ───────────────────────────────────────────────── */
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }
  function on(target, type, handler, opts) {
    if (target) target.addEventListener(type, handler, opts);
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  var currency;
  try {
    currency = new Intl.NumberFormat('ko-KR');
  } catch (e) {
    currency = { format: function (n) { return String(n); } };
  }
  function won(n) {
    return currency.format(Math.round(n)) + '원';
  }
  function wonParts(n) {
    return won(n);
  }
  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* 저장이 막혀 있어도 동작에는 영향이 없습니다. */
    }
  }

  /* ── 상태 ───────────────────────────────────────────────── */
  var cart = CartLib.create({
    products: PRODUCTS,
    storage: (function () {
      try {
        return window.localStorage;
      } catch (e) {
        return null;
      }
    })()
  });

  var state = {
    filter: 'all',
    modalProduct: null,
    modalOptions: {},
    modalQty: 1,
    lastFocus: null,
    paying: false
  };

  /* ── 토스트 ─────────────────────────────────────────────── */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }

  /* ── 스크롤 잠금 ────────────────────────────────────────── */
  var lockCount = 0;
  function lockScroll() {
    lockCount += 1;
    document.documentElement.classList.add('is-locked');
  }
  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.documentElement.classList.remove('is-locked');
  }

  /* ── 포커스 트랩 ────────────────────────────────────────── */
  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container) {
    function handler(e) {
      if (e.key !== 'Tab') return;
      var nodes = $$(FOCUSABLE, container).filter(function (node) {
        return node.offsetParent !== null || node === document.activeElement;
      });
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    container.addEventListener('keydown', handler);
    return function () {
      container.removeEventListener('keydown', handler);
    };
  }

  /* ── 상품 그리드 ────────────────────────────────────────── */
  var grid = $('#productGrid');

  function productCard(product, index) {
    var badge = product.badge
      ? '<span class="product-card__badge">' + escapeHtml(product.badge) + '</span>'
      : '';
    var card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-reveal', '');
    card.style.transitionDelay = Math.min(index * 45, 360) + 'ms';
    card.innerHTML =
      '<button class="product-card__hit" type="button" data-product="' +
      escapeHtml(product.id) +
      '" aria-label="' +
      escapeHtml(product.name + ' ' + product.nameKo + ' 상세 보기') +
      '">' +
      '<span class="product-card__media" style="background:' + escapeHtml(product.imageBg || '#f0e8dc') + '">' +
      '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.imageAlt) + '" loading="lazy" decoding="async" />' +
      badge +
      '<span class="product-card__view">VIEW DETAILS</span>' +
      '</span>' +
      '<span class="product-card__body">' +
      '<span class="product-card__cat">' + escapeHtml(CATEGORY_LABEL[product.category] || '') + '</span>' +
      '<span class="product-card__name"><em>' + escapeHtml(product.name) + '</em> ' + escapeHtml(product.nameKo) + '</span>' +
      '<span class="product-card__spec">' + escapeHtml(product.specLine) + '</span>' +
      '<span class="product-card__price">' + wonParts(product.price) + '</span>' +
      '</span>' +
      '</button>';
    return card;
  }

  var revealObserver = null;
  function observeReveals(root) {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      $$('[data-reveal]', root).forEach(function (el) {
        el.classList.add('is-revealed');
      });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
    }
    $$('[data-reveal]', root).forEach(function (el) {
      if (!el.classList.contains('is-revealed')) revealObserver.observe(el);
    });
  }

  function visibleProducts() {
    return state.filter === 'all'
      ? PRODUCTS
      : PRODUCTS.filter(function (p) {
          return p.category === state.filter;
        });
  }

  function renderGrid() {
    if (!grid) return;
    var items = visibleProducts();
    grid.innerHTML = '';
    grid.classList.add('is-swapping');
    requestAnimationFrame(function () {
      items.forEach(function (product, i) {
        grid.appendChild(productCard(product, i));
      });
      grid.classList.remove('is-swapping');
      observeReveals(grid);
    });
  }

  function renderFilterCounts() {
    $$('.filter__count').forEach(function (node) {
      var filter = node.closest('.filter').getAttribute('data-filter');
      var count =
        filter === 'all'
          ? PRODUCTS.length
          : PRODUCTS.filter(function (p) {
              return p.category === filter;
            }).length;
      node.textContent = count;
    });
  }

  function setFilter(filter) {
    if (!filter) return;
    state.filter = filter;
    $$('.filter').forEach(function (btn) {
      var active = btn.getAttribute('data-filter') === filter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderGrid();
  }

  on($('#filterBar'), 'click', function (e) {
    var btn = e.target.closest('.filter');
    if (!btn) return;
    setFilter(btn.getAttribute('data-filter'));
  });

  on(grid, 'click', function (e) {
    var hit = e.target.closest('[data-product]');
    if (!hit) return;
    openProduct(hit.getAttribute('data-product'));
  });

  /* ── 상품 모달 ──────────────────────────────────────────── */
  var modal = $('#productModal');
  var modalOptionsEl = $('#modalOptions');
  var modalQtyEl = $('#modalQty');
  var modalPriceEl = $('#modalPrice');
  var modalTotalEl = $('#modalTotal');
  var releaseModalTrap = null;

  function unitPriceFor(product, options) {
    return CartLib.resolveUnitPrice(product, options);
  }

  function renderModalOptions() {
    var product = state.modalProduct;
    if (!product) return;
    modalOptionsEl.innerHTML = '';
    (product.options || []).forEach(function (group) {
      var wrap = document.createElement('div');
      wrap.className = 'option-group';
      var label = document.createElement('p');
      label.className = 'option-group__label';
      label.innerHTML =
        escapeHtml(group.name) +
        ' <span>' + escapeHtml(state.modalOptions[group.name]) + '</span>';
      wrap.appendChild(label);

      var values = document.createElement('div');
      values.className = 'option-values';
      group.values.forEach(function (value) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'option-chip';
        chip.setAttribute('data-group', group.name);
        chip.setAttribute('data-value', value.label);
        var selected = state.modalOptions[group.name] === value.label;
        chip.classList.toggle('is-selected', selected);
        chip.setAttribute('aria-pressed', selected ? 'true' : 'false');
        var delta = value.delta
          ? '<em>' + (value.delta > 0 ? '+' : '−') + won(Math.abs(value.delta)).replace('원', '') + '원</em>'
          : '';
        chip.innerHTML = escapeHtml(value.label) + delta;
        values.appendChild(chip);
      });
      wrap.appendChild(values);
      modalOptionsEl.appendChild(wrap);
    });
  }

  function updateModalPricing() {
    var product = state.modalProduct;
    if (!product) return;
    var unit = unitPriceFor(product, state.modalOptions);
    modalPriceEl.textContent = won(unit);
    modalTotalEl.innerHTML =
      '선택 금액 <strong>' + won(unit * state.modalQty) + '</strong> <span>· ' + state.modalQty + '개</span>';
    modalQtyEl.textContent = String(state.modalQty);
  }

  function openProduct(id) {
    var product = PRODUCT_MAP[id];
    if (!product) return;
    state.modalProduct = product;
    state.modalOptions = CartLib.defaultOptions(product);
    state.modalQty = 1;
    state.lastFocus = document.activeElement;

    $('#modalImage').src = product.image;
    $('#modalImage').alt = product.imageAlt;
    $('.modal__media').style.background = product.imageBg || '#f0e8dc';
    $('#modalCategory').textContent = CATEGORY_LABEL[product.category] || '';
    $('#modalName').innerHTML =
      '<em>' + escapeHtml(product.name) + '</em> ' + escapeHtml(product.nameKo);
    $('#modalSub').textContent = product.subtitle;
    $('#modalDesc').innerHTML = product.description
      .map(function (p) {
        return '<p>' + escapeHtml(p) + '</p>';
      })
      .join('');
    $('#modalSpecs').innerHTML = product.specs
      .map(function (row) {
        return '<div><dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd></div>';
      })
      .join('');
    $('#modalShipping').textContent = product.shippingNote;

    renderModalOptions();
    updateModalPricing();

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('has-overlay');
    lockScroll();
    modal.querySelector('.modal__panel').scrollTop = 0;
    releaseModalTrap = trapFocus(modal);
    setTimeout(function () {
      $('#modalClose').focus();
    }, 30);
  }

  function closeProduct() {
    if (modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('has-overlay');
    unlockScroll();
    if (releaseModalTrap) {
      releaseModalTrap();
      releaseModalTrap = null;
    }
    if (state.lastFocus && document.contains(state.lastFocus)) {
      state.lastFocus.focus();
    }
    state.modalProduct = null;
  }

  on($('#modalClose'), 'click', closeProduct);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeProduct();
  });

  on(modalOptionsEl, 'click', function (e) {
    var chip = e.target.closest('.option-chip');
    if (!chip) return;
    var group = chip.getAttribute('data-group');
    state.modalOptions[group] = chip.getAttribute('data-value');
    renderModalOptions();
    updateModalPricing();
  });

  on($('#modalMinus'), 'click', function () {
    state.modalQty = Math.max(1, state.modalQty - 1);
    updateModalPricing();
  });
  on($('#modalPlus'), 'click', function () {
    state.modalQty = Math.min(10, state.modalQty + 1);
    updateModalPricing();
  });

  on($('#modalAdd'), 'click', function () {
    var product = state.modalProduct;
    if (!product) return;
    cart.add(product.id, state.modalOptions, state.modalQty);
    closeProduct();
    toast(product.name + ' ' + product.nameKo + ' · ' + state.modalQty + '개를 담았습니다');
    openCart();
  });

  /* ── 장바구니 드로어 ────────────────────────────────────── */
  var drawer = $('#cartDrawer');
  var scrim = $('#scrim');
  var cartItemsEl = $('#cartItems');
  var releaseDrawerTrap = null;

  function renderCart(snap) {
    snap = snap || cart.snapshot();
    var countEl = $('#cartCount');
    var prevCount = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = String(snap.count);
    countEl.setAttribute('data-empty', snap.count === 0 ? 'true' : 'false');
    $('#cartTitleCount').textContent = '(' + snap.count + ')';

    if (snap.count > prevCount) {
      countEl.classList.add('is-bump');
      setTimeout(function () {
        countEl.classList.remove('is-bump');
      }, 320);
    }

    var isEmpty = snap.items.length === 0;
    $('#cartEmpty').hidden = !isEmpty;
    cartItemsEl.hidden = isEmpty;
    $('#cartFoot').hidden = isEmpty;

    cartItemsEl.innerHTML = snap.items
      .map(function (line) {
        return (
          '<li class="cart-item" data-key="' + escapeHtml(line.key) + '">' +
          '<button class="cart-item__media" type="button" data-open="' + escapeHtml(line.productId) + '" aria-label="상품 보기" style="background:' + escapeHtml(line.product.imageBg || '#f0e8dc') + '">' +
          '<img src="' + escapeHtml(line.product.image) + '" alt="" loading="lazy" />' +
          '</button>' +
          '<div class="cart-item__info">' +
          '<p class="cart-item__name"><em>' + escapeHtml(line.product.name) + '</em> ' + escapeHtml(line.product.nameKo) + '</p>' +
          '<p class="cart-item__opt">' + escapeHtml(line.optionText || '기본 옵션') + '</p>' +
          '<div class="cart-item__row">' +
          '<div class="qty qty--sm">' +
          '<button class="qty__btn" type="button" data-act="dec" aria-label="수량 줄이기">−</button>' +
          '<span class="qty__value">' + line.qty + '</span>' +
          '<button class="qty__btn" type="button" data-act="inc" aria-label="수량 늘리기">+</button>' +
          '</div>' +
          '<p class="cart-item__price">' + won(line.lineTotal) + '</p>' +
          '</div>' +
          '</div>' +
          '<button class="cart-item__remove" type="button" data-act="remove" aria-label="' +
          escapeHtml(line.product.name + ' 삭제') + '">×</button>' +
          '</li>'
        );
      })
      .join('');

    $('#cartSubtotal').textContent = won(snap.subtotal);
    $('#cartShipping').textContent = snap.shipping === 0 ? '무료' : won(snap.shipping);
    $('#cartTotal').textContent = won(snap.total);

    var ratio = Math.min(1, snap.subtotal / snap.freeShippingThreshold);
    $('#freeshipBar').style.width = (ratio * 100).toFixed(1) + '%';
    $('#freeshipText').innerHTML =
      snap.freeShippingRemaining > 0
        ? '<strong>' + won(snap.freeShippingRemaining) + '</strong> 더 담으면 무료배송'
        : '무료배송이 적용되었습니다 <span aria-hidden="true">◈</span>';

    if (!$('#checkout').hidden) renderCheckoutSummary(snap);
  }

  function openCart() {
    if (!drawer.hidden) return;
    state.lastFocus = document.activeElement;
    drawer.hidden = false;
    scrim.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('has-overlay');
    lockScroll();
    requestAnimationFrame(function () {
      drawer.classList.add('is-open');
      scrim.classList.add('is-open');
    });
    releaseDrawerTrap = trapFocus(drawer);
    setTimeout(function () {
      $('#cartClose').focus();
    }, 40);
  }

  function closeCart() {
    if (drawer.hidden) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('has-overlay');
    unlockScroll();
    if (releaseDrawerTrap) {
      releaseDrawerTrap();
      releaseDrawerTrap = null;
    }
    setTimeout(function () {
      drawer.hidden = true;
      scrim.hidden = true;
    }, 380);
    if (state.lastFocus && document.contains(state.lastFocus)) {
      state.lastFocus.focus();
    }
  }

  on($('#cartTrigger'), 'click', openCart);
  on($('#cartClose'), 'click', closeCart);
  on(scrim, 'click', function () {
    if (!drawer.hidden) closeCart();
  });
  on($('#cartEmptyShop'), 'click', function () {
    closeCart();
    document.getElementById('shop').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });

  on(cartItemsEl, 'click', function (e) {
    var li = e.target.closest('.cart-item');
    if (!li) return;
    var key = li.getAttribute('data-key');
    var openBtn = e.target.closest('[data-open]');
    if (openBtn) {
      closeCart();
      openProduct(openBtn.getAttribute('data-open'));
      return;
    }
    var actBtn = e.target.closest('[data-act]');
    if (!actBtn) return;
    var act = actBtn.getAttribute('data-act');
    var snap = cart.snapshot();
    var line = snap.items.filter(function (l) {
      return l.key === key;
    })[0];
    if (!line) return;
    if (act === 'inc') cart.setQty(key, line.qty + 1);
    if (act === 'dec') {
      if (line.qty <= 1) {
        cart.remove(key);
        toast('장바구니에서 삭제했습니다');
      } else {
        cart.setQty(key, line.qty - 1);
      }
    }
    if (act === 'remove') {
      cart.remove(key);
      toast('장바구니에서 삭제했습니다');
    }
  });

  cart.subscribe(renderCart);

  /* ── 주문서 / 결제 ──────────────────────────────────────── */
  var checkout = $('#checkout');
  var checkoutForm = $('#checkoutForm');
  var checkoutBody = $('#checkoutBody');
  var checkoutSuccess = $('#checkoutSuccess');
  var payBtn = $('#payBtn');
  var payBtnLabel = $('#payBtnLabel');
  var currentSnapshot = null;
  var formDirty = false;

  var releaseCheckoutTrap = null;

  function openCheckout() {
    var snap = cart.snapshot();
    if (!snap.items.length) {
      toast('장바구니가 비어 있습니다');
      return;
    }
    closeCart();
    currentSnapshot = snap;
    renderCheckoutSummary(snap);
    $('#checkoutMode').hidden = !Pay.isTestMode();
    $('#asideMode').textContent = Pay.isTestMode()
      ? '테스트 결제 · 실제 청구 없음'
      : '실제 결제가 진행됩니다';
    checkoutBody.hidden = false;
    checkoutSuccess.hidden = true;
    checkout.hidden = false;
    checkout.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(function () {
      checkout.scrollTop = 0;
    }, 10);
    restoreCheckoutDraft();
    releaseCheckoutTrap = trapFocus(checkout);
    setTimeout(function () {
      $('#checkoutClose').focus();
    }, 40);
  }

  function closeCheckout() {
    if (checkout.hidden) return;
    checkout.hidden = true;
    checkout.setAttribute('aria-hidden', 'true');
    unlockScroll();
    if (releaseCheckoutTrap) {
      releaseCheckoutTrap();
      releaseCheckoutTrap = null;
    }
    if (document.activeElement && checkout.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    $('#cartTrigger').focus();
  }

  on($('#checkoutBtn'), 'click', openCheckout);
  on($('#checkoutClose'), 'click', function () {
    if (checkoutSuccess.hidden === false) {
      // 주문 완료 화면에서 닫으면 쇼핑으로 복귀
      closeCheckout();
      document.getElementById('shop').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      return;
    }
    closeCheckout();
  });

  function renderCheckoutSummary(snap) {
    if (!snap) return;
    currentSnapshot = snap;
    var list = $('#summaryItems');
    if (list) {
      list.innerHTML = snap.items
        .map(function (line) {
          return (
            '<li class="summary-item">' +
            '<img src="' + escapeHtml(line.product.image) + '" alt="" loading="lazy" style="background:' + escapeHtml(line.product.imageBg || '#f0e8dc') + '" />' +
            '<div>' +
            '<p class="summary-item__name">' + escapeHtml(line.product.name) + ' <span>' + escapeHtml(line.product.nameKo) + '</span></p>' +
            '<p class="summary-item__opt">' + escapeHtml(line.optionText || '기본 옵션') + ' · ' + line.qty + '개</p>' +
            '</div>' +
            '<p class="summary-item__price">' + won(line.lineTotal) + '</p>' +
            '</li>'
          );
        })
        .join('');
    }
    $('#sumSubtotal').textContent = won(snap.subtotal);
    $('#sumShipping').textContent = snap.shipping === 0 ? '무료' : won(snap.shipping);
    $('#sumTotal').textContent = won(snap.total);
    updatePayLabel();
  }

  function selectedMethod() {
    var checked = checkoutForm.querySelector('input[name="payMethod"]:checked');
    return checked ? checked.value : 'card';
  }

  function updatePayLabel() {
    if (!currentSnapshot) return;
    var method = selectedMethod();
    payBtnLabel.textContent =
      method === 'bank'
        ? won(currentSnapshot.total) + ' 주문하기'
        : won(currentSnapshot.total) + ' 결제하기';
  }

  checkoutForm.addEventListener('change', function (e) {
    formDirty = true;
    if (e.target.name === 'payMethod') updatePayLabel();
    if (e.target.id === 'memoPreset') {
      var memoField = $('#memoField');
      memoField.hidden = e.target.value !== '직접 입력';
      if (memoField.hidden) $('#memoText').value = '';
    }
    if (e.target.id === 'sameAsOrderer') syncRecipient();
    if (e.target.id === 'agreeAll') {
      $$('input[data-required="true"], #agreeNews').forEach(function (box) {
        box.checked = e.target.checked;
      });
      clearError('agreePurchase');
    }
    if (e.target.matches('#agreePurchase, #agreePrivacy, #agreeNews')) {
      var boxes = $$('#agreePurchase, #agreePrivacy, #agreeNews');
      $('#agreeAll').checked = boxes.every(function (b) {
        return b.checked;
      });
      clearError(e.target.id);
    }
  });

  function syncRecipient() {
    var same = $('#sameAsOrderer').checked;
    $('#recipientRow').hidden = same;
    if (same) {
      $('#shipName').value = '';
      $('#shipPhone').value = '';
      clearError('shipName');
      clearError('shipPhone');
    }
  }

  /* ── 유효성 검사 ────────────────────────────────────────── */
  function setError(id, message) {
    var box = document.querySelector('[data-error-for="' + id + '"]');
    var field = document.getElementById(id);
    if (box) {
      box.textContent = message || '';
      box.classList.toggle('is-visible', !!message);
    }
    if (field) {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.toggle('has-error', !!message);
    }
  }
  function clearError(id) {
    setError(id, '');
  }

  var phoneRe = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateCheckout() {
    var errors = [];
    var name = $('#orderName').value.trim();
    var phone = $('#orderPhone').value.replace(/\s/g, '');
    var email = $('#orderEmail').value.trim();
    var zip = $('#zip').value.trim();
    var addr1 = $('#addr1').value.trim();
    var same = $('#sameAsOrderer').checked;

    if (name.length < 2) errors.push(['orderName', '이름을 2자 이상 입력해 주세요.']);
    if (!phoneRe.test(phone)) errors.push(['orderPhone', '휴대폰 번호를 정확히 입력해 주세요.']);
    if (!emailRe.test(email)) errors.push(['orderEmail', '이메일 주소를 확인해 주세요.']);
    if (!same) {
      if ($('#shipName').value.trim().length < 2) errors.push(['shipName', '받는 분 이름을 입력해 주세요.']);
      if (!phoneRe.test($('#shipPhone').value.replace(/\s/g, '')))
        errors.push(['shipPhone', '받는 분 연락처를 정확히 입력해 주세요.']);
    }
    if (!/^\d{5}$/.test(zip)) errors.push(['zip', '우편번호 5자리를 입력해 주세요.']);
    if (addr1.length < 4) errors.push(['addr1', '주소를 입력해 주세요.']);
    if (!$('#agreePurchase').checked)
      errors.push(['agreePurchase', '구매 조건 확인 및 결제 진행에 동의해 주세요.']);

    ['orderName', 'orderPhone', 'orderEmail', 'shipName', 'shipPhone', 'zip', 'addr1', 'agreePurchase'].forEach(
      function (id) {
        if (
          !errors.some(function (pair) {
            return pair[0] === id;
          })
        )
          clearError(id);
      }
    );

    errors.forEach(function (pair) {
      setError(pair[0], pair[1]);
    });

    if (errors.length) {
      var first = document.getElementById(errors[0][0]);
      if (first) {
        first.focus({ preventScroll: true });
        var field = first.closest('.fieldset') || first;
        field.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      }
      toast('입력하지 않은 항목이 있습니다');
      return false;
    }
    return true;
  }

  function markAllErrors(errors) {
    errors.forEach(function (pair) {
      setError(pair[0], pair[1]);
    });
  }

  /* ── 결제 실행 ──────────────────────────────────────────── */
  function orderNameFrom(snap) {
    var first = snap.items[0];
    if (!first) return 'ÉLIVON 주문';
    var base = first.product.name + ' ' + first.product.nameKo;
    if (snap.items.length === 1) return base + (first.qty > 1 ? ' 외 ' + (first.qty - 1) + '개' : '');
    var totalCount = snap.count;
    return base + ' 외 ' + (totalCount - first.qty) + '개';
  }

  function setPaying(on) {
    state.paying = on;
    payBtn.classList.toggle('is-loading', on);
    payBtn.disabled = on;
    if (on) {
      payBtnLabel.textContent = '결제 진행 중…';
    } else {
      updatePayLabel();
    }
  }

  checkoutForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.paying) return;
    submitOrder();
  });

  function submitOrder() {
    if (state.paying) return;
    var snap = cart.snapshot();
    if (!snap.items.length) {
      toast('장바구니가 비어 있습니다');
      return;
    }
    if (!validateCheckout()) return;

    var method = selectedMethod();
    var orderNo = Pay.createOrderNo();
    var buyer = {
      name: $('#orderName').value.trim(),
      phone: $('#orderPhone').value.replace(/\s/g, ''),
      email: $('#orderEmail').value.trim()
    };
    var shipping = {
      name: $('#sameAsOrderer').checked ? buyer.name : $('#shipName').value.trim(),
      phone: $('#sameAsOrderer').checked ? buyer.phone : $('#shipPhone').value.replace(/\s/g, ''),
      zip: $('#zip').value.trim(),
      addr1: $('#addr1').value.trim(),
      addr2: $('#addr2').value.trim(),
      memo: $('#memoPreset').value === '직접 입력' ? $('#memoText').value.trim() : $('#memoPreset').value
    };

    setPaying(true);

    Pay.requestPayment({
      orderNo: orderNo,
      orderName: orderNameFrom(snap),
      amount: snap.total,
      method: method,
      customerName: buyer.name,
      customerEmail: buyer.email,
      customerPhone: buyer.phone
    })
      .then(function (result) {
        if (result.status === 'redirecting') return; // PG 결제창으로 이동 중
        var order = {
          orderNo: result.orderNo,
          method: result.method,
          methodLabel: result.methodLabel,
          amount: result.amount,
          status: result.status,
          paymentKey: result.paymentKey,
          approvedAt: result.approvedAt,
          bank: result.bank || null,
          buyer: buyer,
          shipping: shipping,
          items: snap.items.map(function (line) {
            return {
              productId: line.productId,
              name: line.product.name + ' ' + line.product.nameKo,
              options: line.options,
              optionText: line.optionText,
              qty: line.qty,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal
            };
          }),
          subtotal: snap.subtotal,
          shippingFee: snap.shipping,
          total: snap.total,
          test: !!result.test
        };
        completeOrder(order);
      })
      .catch(function (err) {
        setPaying(false);
        var msg = err && err.message ? err.message : '결제에 실패했습니다. 잠시 후 다시 시도해 주세요.';
        toast(msg);
        var note = document.createElement('p');
        note.className = 'pay-error';
        note.textContent = msg;
        var existing = $('.pay-error');
        if (existing) existing.remove();
        payBtn.insertAdjacentElement('beforebegin', note);
      });
  }

  function completeOrder(order) {
    setPaying(false);
    safeSet(LAST_ORDER_KEY, JSON.stringify(order));
    cart.clear();

    var bank = order.bank;
    var deliveryNote =
      order.method === 'bank'
        ? '입금이 확인되는 대로 셋업·조율 후 발송됩니다.'
        : '셋업과 조율을 마친 뒤 순차적으로 발송됩니다.';

    checkoutSuccess.innerHTML =
      '<div class="success__inner">' +
      '<p class="success__eyebrow">Order Complete</p>' +
      '<p class="success__seal" aria-hidden="true">◈</p>' +
      '<h2>주문이 완료되었습니다</h2>' +
      '<p class="success__lede">' + escapeHtml(order.buyer.name) + '님, ÉLIVON을 찾아 주셔서 감사합니다.<br />주문 확인서를 ' + escapeHtml(order.buyer.email) + '로 보내드렸습니다.</p>' +
      '<div class="success__card">' +
      '<div class="success__row"><span>주문번호</span><strong class="success__order">' + escapeHtml(order.orderNo) + '</strong></div>' +
      '<div class="success__row"><span>결제수단</span><span>' + escapeHtml(order.methodLabel) + '</span></div>' +
      '<div class="success__row"><span>결제금액</span><span>' + won(order.total) + '</span></div>' +
      '<div class="success__row"><span>' + (order.status === 'awaiting_deposit' ? '주문상태' : '결제시각') + '</span><span>' +
      (order.status === 'awaiting_deposit'
        ? '입금 대기'
        : new Date(order.approvedAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })) +
      '</span></div>' +
      '<div class="success__row"><span>배송지</span><span>' + escapeHtml(order.shipping.addr1) + ' ' + escapeHtml(order.shipping.addr2) + '</span></div>' +
      '</div>' +
      (bank
        ? '<div class="success__bank"><p class="success__bank-title">입금 계좌 안내</p>' +
          '<p><strong>' + escapeHtml(bank.bank) + ' ' + escapeHtml(bank.account) + '</strong> (예금주 ' + escapeHtml(bank.holder) + ')</p>' +
          '<p>입금 기한: ' + new Date(bank.dueDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) +
          '까지 · 입금자명을 주문자 이름으로 입력해 주세요.</p></div>'
        : '') +
      '<ul class="success__items">' +
      order.items
        .map(function (item) {
          return (
            '<li><span>' + escapeHtml(item.name) + '</span>' +
            '<span>' + escapeHtml(item.optionText || '기본 옵션') + ' · ' + item.qty + '개</span>' +
            '<span>' + won(item.lineTotal) + '</span></li>'
          );
        })
        .join('') +
      '</ul>' +
      '<p class="success__note">' + escapeHtml(deliveryNote) + ' ' +
      (order.test ? '테스트 결제로 진행되어 실제 결제·배송은 이루어지지 않습니다.' : '') +
      '</p>' +
      '<div class="success__actions">' +
      '<button class="btn btn--solid" type="button" id="successContinue">쇼핑 계속하기</button>' +
      '<button class="btn btn--ghost" type="button" id="successReceipt">주문 확인서 인쇄</button>' +
      '</div>' +
      '</div>';

    checkoutBody.hidden = true;
    checkoutSuccess.hidden = false;
    checkout.scrollTop = 0;

    var cont = $('#successContinue');
    if (cont)
      cont.addEventListener('click', function () {
        closeCheckout();
        document.getElementById('shop').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    var receipt = $('#successReceipt');
    if (receipt)
      receipt.addEventListener('click', function () {
        try {
          window.print();
        } catch (e) {
          toast('이 브라우저에서는 인쇄를 열 수 없습니다.');
        }
      });

    renderCart(cart.snapshot());
  }

  /* ── 주문서 임시 저장 ───────────────────────────────────── */
  var DRAFT_KEY = 'elivon:checkoutDraft:v1';

  checkoutForm.addEventListener('input', function () {
    formDirty = true;
  });

  function saveCheckoutDraft() {
    if (!formDirty) return;
    var draft = {};
    ['orderName', 'orderPhone', 'orderEmail', 'zip', 'addr1', 'addr2', 'shipName', 'shipPhone', 'memoText'].forEach(
      function (id) {
        var el = document.getElementById(id);
        if (el) draft[id] = el.value;
      }
    );
    draft.sameAsOrderer = $('#sameAsOrderer').checked;
    draft.payMethod = selectedMethod();
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      /* 무시 */
    }
  }

  function restoreCheckoutDraft() {
    var raw = null;
    try {
      raw = sessionStorage.getItem(DRAFT_KEY);
    } catch (e) {
      raw = null;
    }
    if (!raw) return;
    var draft;
    try {
      draft = JSON.parse(raw);
    } catch (e) {
      return;
    }
    Object.keys(draft).forEach(function (key) {
      if (key === 'sameAsOrderer') {
        $('#sameAsOrderer').checked = !!draft[key];
        return;
      }
      if (key === 'payMethod') {
        var radio = checkoutForm.querySelector('input[name="payMethod"][value="' + draft[key] + '"]');
        if (radio) radio.checked = true;
        return;
      }
      var el = document.getElementById(key);
      if (el && typeof draft[key] === 'string') el.value = draft[key];
    });
    syncRecipient();
    updatePayLabel();
  }

  window.addEventListener('beforeunload', saveCheckoutDraft);
  window.addEventListener('pagehide', saveCheckoutDraft);

  /* ── 아코디언 ───────────────────────────────────────────── */
  $$('#learnAccordion .accordion__trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      var open = trigger.getAttribute('aria-expanded') === 'true';
      // 한 번에 하나만 열립니다.
      $$('#learnAccordion .accordion__trigger').forEach(function (other) {
        if (other === trigger) return;
        other.setAttribute('aria-expanded', 'false');
        var p = document.getElementById(other.getAttribute('aria-controls'));
        if (p) p.hidden = true;
      });
      trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (panel) panel.hidden = open;
    });
  });

  /* ── 헤더 / 내비게이션 ──────────────────────────────────── */
  var topbar = $('#topbar');
  var lastScroll = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    topbar.classList.toggle('is-scrolled', y > 24);
    topbar.classList.toggle('is-hidden', y > 480 && y > lastScroll && !topbar.classList.contains('is-open'));
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var menuTrigger = $('#menuTrigger');
  var mobileNav = $('#mobileNav');
  function closeMobileNav() {
    mobileNav.hidden = true;
    menuTrigger.setAttribute('aria-expanded', 'false');
    menuTrigger.setAttribute('aria-label', '메뉴 열기');
    topbar.classList.remove('is-open');
  }
  on(menuTrigger, 'click', function () {
    var open = menuTrigger.getAttribute('aria-expanded') === 'true';
    if (open) {
      closeMobileNav();
    } else {
      mobileNav.hidden = false;
      topbar.classList.add('is-open');
      topbar.classList.remove('is-hidden');
      menuTrigger.setAttribute('aria-expanded', 'true');
      menuTrigger.setAttribute('aria-label', '메뉴 닫기');
    }
  });
  $$('#mobileNav a').forEach(function (link) {
    link.addEventListener('click', closeMobileNav);
  });

  /* ── 푸터 카테고리 링크 ─────────────────────────────────── */
  $$('[data-footer-filter]').forEach(function (link) {
    link.addEventListener('click', function () {
      setFilter(link.getAttribute('data-footer-filter'));
    });
  });

  /* ── 문의 폼 ────────────────────────────────────────────── */
  var contactForm = $('#contactForm');
  on(contactForm, 'submit', function (e) {
    e.preventDefault();
    var name = $('#contactName').value.trim();
    var email = $('#contactEmail').value.trim();
    var message = $('#contactMessage').value.trim();
    var ok = true;

    function setContactError(id, msg) {
      var box = document.querySelector('[data-error-for="' + id + '"]');
      var field = document.getElementById(id);
      if (box) {
        box.textContent = msg || '';
        box.classList.toggle('is-visible', !!msg);
      }
      if (field && !(field instanceof HTMLInputElement && field.type === 'checkbox')) {
        field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      }
      if (field) {
        var wrap = field.closest('.field');
        if (wrap) wrap.classList.toggle('has-error', !!msg);
      }
    }

    setContactError('contactName', name.length >= 2 ? '' : '이름을 입력해 주세요.');
    setContactError('contactEmail', emailRe.test(email) ? '' : '이메일 주소를 확인해 주세요.');
    setContactError('contactMessage', message.length >= 10 ? '' : '문의 내용을 10자 이상 적어 주세요.');
    setContactError(
      'contactPrivacy',
      $('#contactPrivacy').checked ? '' : '개인정보 수집·이용에 동의해 주세요.'
    );

    ['contactName', 'contactEmail', 'contactMessage'].forEach(function (id) {
      var el = document.getElementById(id);
      var box = document.querySelector('[data-error-for="' + id + '"]');
      if (el && box && box.classList.contains('is-visible')) ok = false;
    });
    if (!$('#contactPrivacy').checked) ok = false;

    if (!ok) {
      toast('입력하지 않은 항목이 있습니다');
      return;
    }

    var status = $('#contactStatus');
    status.textContent = '문의가 접수되었습니다. 1–2일 내 답변드립니다.';
    status.classList.add('is-visible');
    contactForm.reset();
    toast('문의를 보냈습니다');
  });

  /* ── 초기 렌더 ──────────────────────────────────────────── */
  renderFilterCounts();
  renderGrid();
  renderCart(cart.snapshot());
  $('#year').textContent = String(new Date().getFullYear());
  observeReveals(document);

  if (Pay.isTestMode()) {
    var footNote = document.querySelector('.drawer__note');
    if (footNote) footNote.textContent = '테스트 결제 모드입니다. 실제 금액이 청구되지 않습니다.';
  }

  /* PG 리다이렉트 복귀 처리 */
  if (window.location.search.indexOf('paymentKey=') !== -1 && Pay.confirmRedirect) {
    Pay.confirmRedirect()
      .then(function (result) {
        if (!result) return;
        toast('결제가 완료되었습니다 · ' + result.orderNo);
      })
      .catch(function (err) {
        toast(err.message || '결제 승인에 실패했습니다.');
      });
  }

  /* ── 전역 키보드 ────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) {
      closeProduct();
    } else if (!checkout.hidden) {
      closeCheckout();
    } else if (!drawer.hidden) {
      closeCart();
    } else if (!mobileNav.hidden) {
      closeMobileNav();
    }
  });

  /* 테스트/디버깅용 (콘솔에서 ElivonApp.cart 등으로 확인) */
  window.ElivonApp = {
    cart: cart,
    products: PRODUCTS,
    setFilter: setFilter,
    openProduct: openProduct,
    openCart: openCart,
    openCheckout: openCheckout,
    validateCheckout: validateCheckout,
    markAllErrors: markAllErrors,
    state: state
  };
})();
