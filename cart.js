/* ==========================================================================
   ÉLIVON — 장바구니 상태 모듈 (UI와 분리된 순수 로직)
   --------------------------------------------------------------------------
   · 브라우저에서는 window.ELIVON_CART 로, Node 테스트에서는 require 로 사용합니다.
   · 저장소를 주입받으므로 테스트에서는 메모리 저장소를 씁니다.
   ========================================================================== */

(function (root) {
  'use strict';

  var STORAGE_KEY = 'elivon:cart:v1';
  var FREE_SHIPPING_THRESHOLD = 100000; // 이 금액 이상이면 무료배송
  var SHIPPING_FEE = 4000;

  function makeLineKey(productId, options) {
    var parts = Object.keys(options || {})
      .sort()
      .map(function (k) {
        return k + '=' + options[k];
      });
    return parts.length ? productId + '::' + parts.join('|') : productId;
  }

  function resolveUnitPrice(product, options) {
    var price = product.price;
    (product.options || []).forEach(function (group) {
      var chosen = options && options[group.name];
      var value = group.values.filter(function (v) {
        return v.label === chosen;
      })[0];
      if (value) price += value.delta || 0;
    });
    return price;
  }

  function defaultOptions(product) {
    var out = {};
    (product.options || []).forEach(function (group) {
      out[group.name] = group.values[0].label;
    });
    return out;
  }

  function normalizeQty(qty) {
    var n = parseInt(qty, 10);
    if (!isFinite(n)) n = 1;
    return Math.min(10, Math.max(1, n));
  }

  function createCart(config) {
    config = config || {};
    var products = config.products || [];
    var byId = {};
    products.forEach(function (p) {
      byId[p.id] = p;
    });

    var storage = config.storage || null;
    var storageKey = config.storageKey || STORAGE_KEY;
    var listeners = [];

    var items = [];

    function persist() {
      if (!storage) return;
      try {
        storage.setItem(storageKey, JSON.stringify(items));
      } catch (err) {
        /* 저장 공간이 막힌 경우에도 세션 내 장바구니는 동작해야 합니다. */
      }
    }

    function hydrate() {
      if (!storage) return;
      var raw = null;
      try {
        raw = storage.getItem(storageKey);
      } catch (err) {
        raw = null;
      }
      if (!raw) return;
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        return;
      }
      if (!Array.isArray(parsed)) return;
      items = parsed
        .filter(function (line) {
          return line && byId[line.productId];
        })
        .map(function (line) {
          var product = byId[line.productId];
          var options = defaultOptions(product);
          Object.keys(line.options || {}).forEach(function (name) {
            options[name] = line.options[name];
          });
          return {
            key: makeLineKey(product.id, options),
            productId: product.id,
            options: options,
            qty: normalizeQty(line.qty)
          };
        });
      dedupe();
    }

    function dedupe() {
      var merged = {};
      var order = [];
      items.forEach(function (line) {
        if (merged[line.key]) {
          merged[line.key].qty = normalizeQty(merged[line.key].qty + line.qty);
        } else {
          merged[line.key] = line;
          order.push(line.key);
        }
      });
      items = order.map(function (key) {
        return merged[key];
      });
    }

    function emit() {
      var snap = snapshot();
      listeners.forEach(function (fn) {
        try {
          fn(snap);
        } catch (err) {
          /* 리스너 오류가 장바구니 상태를 깨뜨리지 않도록 무시합니다. */
        }
      });
    }

    hydrate();

    function lineView(line) {
      var product = byId[line.productId];
      var unitPrice = resolveUnitPrice(product, line.options);
      return {
        key: line.key,
        productId: line.productId,
        product: product,
        options: Object.assign({}, line.options),
        optionText: Object.keys(line.options)
          .map(function (name) {
            return line.options[name];
          })
          .join(' · '),
        qty: line.qty,
        unitPrice: unitPrice,
        lineTotal: unitPrice * line.qty
      };
    }

    function subtotal() {
      return items.reduce(function (sum, line) {
        return sum + resolveUnitPrice(byId[line.productId], line.options) * line.qty;
      }, 0);
    }

    function shipping() {
      var sub = subtotal();
      if (sub === 0) return 0;
      return sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    }

    function count() {
      return items.reduce(function (sum, line) {
        return sum + line.qty;
      }, 0);
    }

    function snapshot() {
      var sub = subtotal();
      return {
        items: items.map(lineView),
        count: count(),
        subtotal: sub,
        shipping: shipping(),
        total: sub + shipping(),
        freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - sub),
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD
      };
    }

    function add(productId, options, qty) {
      var product = byId[productId];
      if (!product) return null;
      var resolved = defaultOptions(product);
      Object.keys(options || {}).forEach(function (name) {
        resolved[name] = options[name];
      });
      var key = makeLineKey(productId, resolved);
      var existing = items.filter(function (line) {
        return line.key === key;
      })[0];
      if (existing) {
        existing.qty = normalizeQty(existing.qty + normalizeQty(qty || 1));
      } else {
        items.push({
          key: key,
          productId: productId,
          options: resolved,
          qty: normalizeQty(qty || 1)
        });
      }
      persist();
      emit();
      return snapshot();
    }

    function setQty(key, qty) {
      var line = items.filter(function (l) {
        return l.key === key;
      })[0];
      if (!line) return snapshot();
      line.qty = normalizeQty(qty);
      persist();
      emit();
      return snapshot();
    }

    function remove(key) {
      items = items.filter(function (line) {
        return line.key !== key;
      });
      persist();
      emit();
      return snapshot();
    }

    function clear() {
      items = [];
      persist();
      emit();
      return snapshot();
    }

    function subscribe(fn) {
      listeners.push(fn);
      return function unsubscribe() {
        listeners = listeners.filter(function (l) {
          return l !== fn;
        });
      };
    }

    return {
      add: add,
      setQty: setQty,
      remove: remove,
      clear: clear,
      subscribe: subscribe,
      snapshot: snapshot,
      count: count,
      subtotal: subtotal,
      shipping: shipping,
      makeLineKey: makeLineKey,
      resolveUnitPrice: resolveUnitPrice
    };
  }

  var api = {
    create: createCart,
    makeLineKey: makeLineKey,
    resolveUnitPrice: resolveUnitPrice,
    defaultOptions: defaultOptions,
    FREE_SHIPPING_THRESHOLD: FREE_SHIPPING_THRESHOLD,
    SHIPPING_FEE: SHIPPING_FEE,
    STORAGE_KEY: STORAGE_KEY
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ELIVON_CART = api;
})(typeof window !== 'undefined' ? window : globalThis);
