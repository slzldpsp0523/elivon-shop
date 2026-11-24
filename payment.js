/* ==========================================================================
   ÉLIVON — 결제 모듈 (TossPayments 연동 지점)
   --------------------------------------------------------------------------
   이 파일 하나만 수정하면 실제 결제로 전환됩니다.

   ① 연동 준비
      TossPayments 개발자센터(https://developers.tosspayments.com)에서 상점을 만들고
      클라이언트 키를 발급받아 아래 CONFIG.clientKey 에 넣습니다.
        테스트 키 : test_ck_...
        실결제 키 : live_ck_...

   ② 서버 승인 API
      카드 결제는 결제창에서 돌아온 뒤 반드시 서버에서 승인(confirm)해야 합니다.
      시크릿 키는 절대 이 파일(브라우저)에 넣지 마세요.
      CONFIG.confirmEndpoint 에 아래 요청을 받는 서버 주소를 넣습니다.
        POST /api/payments/confirm  { paymentKey, orderId, amount }
        → 토스 API 호출: POST https://api.tosspayments.com/v1/payments/confirm
          Authorization: Basic base64(SECRET_KEY + ':')

   ③ 리다이렉트 결과 처리
      결제창은 successUrl 로 돌아오며 ?paymentKey=&orderId=&amount= 를 붙입니다.
      app.js 에서 ElivonPay.confirmRedirect() 를 호출하면 승인까지 마무리합니다.

   클라이언트 키가 비어 있으면 자동으로 "테스트 시뮬레이션" 모드로 동작하여
   실제 금액이 청구되지 않습니다. (UI 에 테스트 모드 배지가 표시됩니다)
   ========================================================================== */

(function (root) {
  'use strict';

  var CONFIG = {
    clientKey: '', // 예: 'test_ck_xxxxxxxxxxxxxxxx'
    confirmEndpoint: '', // 예: '/api/payments/confirm'
    successUrl: '',
    failUrl: '',
    simulatedDelayMs: 1500,
    simulateFailureRate: 0, // 0~1, 데모에서 실패 화면을 확인할 때만 올려 사용
    sdkUrl: 'https://js.tosspayments.com/v2/standard'
  };

  /* 무통장 입금(계좌이체) 안내 정보 — 실제 계좌로 교체하세요. */
  var BANK_TRANSFER = {
    bank: '국민은행',
    account: '000-0000-0000-00', // TODO: 실제 입금 계좌
    holder: 'ÉLIVON',
    dueDays: 2
  };

  var METHOD_LABELS = {
    card: '신용·체크카드',
    tosspay: '토스페이',
    bank: '계좌이체 (무통장 입금)'
  };

  var TOSS_METHODS = {
    card: 'CARD',
    tosspay: 'TOSSPAY'
  };

  var AMOUNT_MIN = 100;
  var AMOUNT_MAX = 100000000; // 1억 원

  function isTestMode() {
    return !CONFIG.clientKey;
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function dateStamp(date) {
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate())
    );
  }

  function randomToken(size) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var i = 0; i < size; i += 1) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  /** 주문번호: ELV-YYYYMMDD-XXXXXX */
  function createOrderNo(date) {
    var d = date instanceof Date ? date : new Date();
    return 'ELV-' + dateStamp(d) + '-' + randomToken(6);
  }

  function validateAmount(amount) {
    var n = Number(amount);
    if (!isFinite(n) || Math.floor(n) !== n || n < AMOUNT_MIN || n > AMOUNT_MAX) {
      throw new Error('결제 금액이 올바르지 않습니다.');
    }
    return n;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-elivon-sdk]');
      if (existing) {
        if (existing.getAttribute('data-loaded') === 'true') return resolve();
        existing.addEventListener('load', function () {
          resolve();
        });
        existing.addEventListener('error', reject);
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute('data-elivon-sdk', 'true');
      script.onload = function () {
        script.setAttribute('data-loaded', 'true');
        resolve();
      };
      script.onerror = function () {
        reject(new Error('결제 모듈을 불러오지 못했습니다.'));
      };
      document.head.appendChild(script);
    });
  }

  function customerKeyFrom(email, name) {
    var seed = (email || '') + '|' + (name || '');
    var hash = 0;
    for (var i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return 'elivon_' + hash.toString(36);
  }

  function bankTransferInfo(date) {
    var d = date instanceof Date ? date : new Date();
    var due = new Date(d.getTime() + BANK_TRANSFER.dueDays * 24 * 60 * 60 * 1000);
    return {
      bank: BANK_TRANSFER.bank,
      account: BANK_TRANSFER.account,
      holder: BANK_TRANSFER.holder,
      dueDate: due.toISOString()
    };
  }

  /**
   * 결제 요청
   * @param {Object} payload
   *   orderNo, orderName, amount, method('card'|'tosspay'|'bank'),
   *   customerName, customerEmail, customerPhone
   * @returns {Promise<Object>} { ok, status, orderNo, method, amount, paymentKey, approvedAt, bank }
   */
  function requestPayment(payload) {
    var p = payload || {};
    var amount;
    try {
      amount = validateAmount(p.amount);
    } catch (err) {
      return Promise.reject(err);
    }
    var method = METHOD_LABELS[p.method] ? p.method : 'card';
    var orderNo = p.orderNo || createOrderNo();
    var base = {
      orderNo: orderNo,
      orderName: p.orderName || 'ÉLIVON 주문',
      amount: amount,
      method: method,
      methodLabel: METHOD_LABELS[method],
      customerName: p.customerName || '',
      customerEmail: p.customerEmail || ''
    };

    // 무통장 입금: PG 결제창 없이 주문을 접수하고 입금 안내를 돌려줍니다.
    if (method === 'bank') {
      return delay(500).then(function () {
        return Object.assign({}, base, {
          ok: true,
          status: 'awaiting_deposit',
          paymentKey: null,
          approvedAt: null,
          bank: bankTransferInfo()
        });
      });
    }

    // 실제 PG 연동
    if (!isTestMode()) {
      return loadScript(CONFIG.sdkUrl)
        .then(function () {
          var TossPayments = root.TossPayments;
          if (typeof TossPayments !== 'function') {
            throw new Error('TossPayments 객체를 찾을 수 없습니다.');
          }
          var payment = TossPayments(CONFIG.clientKey).payment({
            customerKey: customerKeyFrom(base.customerEmail, base.customerName)
          });
          return payment.requestPayment({
            method: TOSS_METHODS[method],
            amount: { currency: 'KRW', value: amount },
            orderId: orderNo,
            orderName: base.orderName,
            customerName: base.customerName,
            customerEmail: base.customerEmail,
            successUrl: CONFIG.successUrl || location.origin + location.pathname + '?payment=success',
            failUrl: CONFIG.failUrl || location.origin + location.pathname + '?payment=fail'
          });
        })
        .then(function () {
          // 결제창은 successUrl 로 페이지를 이동시킵니다. 실제 확정은 confirmRedirect() 에서 처리됩니다.
          return Object.assign({}, base, { ok: true, status: 'redirecting' });
        });
    }

    // 테스트 시뮬레이션
    return delay(CONFIG.simulatedDelayMs).then(function () {
      if (Math.random() < CONFIG.simulateFailureRate) {
        var err = new Error('카드 승인이 거절되었습니다. 다른 결제 수단을 선택해 주세요.');
        err.code = 'PAYMENT_DECLINED';
        throw err;
      }
      return Object.assign({}, base, {
        ok: true,
        status: 'paid',
        paymentKey: 'test_pk_' + randomToken(20),
        approvedAt: new Date().toISOString(),
        test: true
      });
    });
  }

  /**
   * 리다이렉트 복귀 처리: ?paymentKey=&orderId=&amount= 를 읽어 서버 승인을 요청합니다.
   * @returns {Promise<Object|null>} 결제 파라미터가 없으면 null
   */
  function confirmRedirect(search) {
    var params = new URLSearchParams(
      search != null ? search : (root.location && root.location.search) || ''
    );
    var paymentKey = params.get('paymentKey');
    var orderId = params.get('orderId');
    var amount = params.get('amount');
    if (!paymentKey || !orderId || !amount) return Promise.resolve(null);

    if (!CONFIG.confirmEndpoint) {
      return Promise.reject(
        new Error('CONFIG.confirmEndpoint(서버 승인 API)가 설정되지 않았습니다.')
      );
    }

    return fetch(CONFIG.confirmEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey: paymentKey, orderId: orderId, amount: Number(amount) })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('결제 승인에 실패했습니다.');
        return res.json();
      })
      .then(function (data) {
        return {
          ok: true,
          status: 'paid',
          orderNo: orderId,
          amount: Number(amount),
          paymentKey: paymentKey,
          approvedAt: data.approvedAt || new Date().toISOString()
        };
      });
  }

  var api = {
    CONFIG: CONFIG,
    METHOD_LABELS: METHOD_LABELS,
    BANK_TRANSFER: BANK_TRANSFER,
    createOrderNo: createOrderNo,
    requestPayment: requestPayment,
    confirmRedirect: confirmRedirect,
    validateAmount: validateAmount,
    isTestMode: isTestMode,
    bankTransferInfo: bankTransferInfo,
    customerKeyFrom: customerKeyFrom
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ElivonPay = api;
})(typeof window !== 'undefined' ? window : globalThis);
