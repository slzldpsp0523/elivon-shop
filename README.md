# ÉLIVON — 온라인 쇼핑몰 프로토타입

브랜드 'ÉLIVON'의 홈페이지 겸 쇼핑몰 정적 프로토타입입니다.
빌드 도구 없이 `index.html`을 브라우저로 열면 바로 동작합니다.

```
elivon-shop/
├─ index.html          전체 화면 구조 (히어로 · SHOP · LEARN · ABOUT · 장바구니 · 주문서)
├─ styles.css          디자인 시스템 (색·타이포·레이아웃·반응형·모션)
├─ app.js              화면 로직 (상품 렌더·필터·모달·장바구니·주문서·검증·접근성)
├─ data.js             상품 카탈로그 12종 (가격·옵션·스펙·설명)
├─ cart.js             장바구니 상태 모듈 (순수 로직, 저장소 주입)
├─ payment.js          결제 모듈 — 토스페이먼츠 연동 지점
├─ assets/             이미지 16장 (히어로·상품 12·학습 2·브랜드 1)
└─ tools/
   ├─ selftest.cjs     로직 자체 점검 스크립트 (28개 검사)
   ├─ e2e.py           브라우저 동작·레이아웃 점검 스크립트
   └─ qa/              점검 스크린샷 (데스크톱·태블릿·모바일)
```

## 바로 열어 보기

`index.html`을 더블클릭하거나, 로컬 서버로 열면 됩니다.

```bash
cd elivon-shop
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
```

## 구현된 기능

**헤더 & 히어로**
- 스크롤에 따라 배경이 생기는 고정 헤더, 모바일 메뉴
- 참고 이미지의 레이아웃·색감을 그대로 살린 첫 화면
  (`Cormorant Garamond` + `Noto Serif KR`, 아이보리 `#F6F2EA`)
- 히어로 이미지는 브랜드 로고가 지워진 버전을 사용해 텍스트가 겹치지 않습니다

**SHOP**
- 카테고리 필터 5종 (전체 / 바이올린 / 첼로 / 활 / 보조품) + 개수 표시
- 상품 12종: 악기 5, 활 2, 보조품 5 (송진·어깨받침·현·케이스·가습기)
- 카드: 이미지 · 카테고리 · 영문/한글 이름 · 스펙 요약 · 가격
- 상세 모달: 설명 3문단, 옵션 선택(추가금 표시), 수량, 상세 스펙 표, 배송 안내, 장바구니 담기

**장바구니 · 결제**
- 슬라이드 드로어: 수량 증감(1–10), 삭제, 무료배송까지 남은 금액 게이지, 합계
- 주문서: 주문자 정보, 배송지(주문자와 동일), 배송 요청사항, 결제 수단 3종, 약관 동의
- 필수값 검증(이름·휴대폰·이메일·우편번호·주소·필수 동의)과 오류 메시지·포커스 이동
- 테스트 결제 후 완료 화면: 주문번호(`ELV-YYYYMMDD-XXXXXX`), 결제수단·금액·시각·배송지, 주문 확인서 인쇄
- 계좌이체 선택 시 '입금 대기' 주문으로 접수하고 계좌·기한 안내
- 장바구니는 `localStorage`, 주문서 입력값은 `sessionStorage`에 임시 보관

**LEARN / ABOUT**
- 관리 가이드 카드 3개 + 아코디언 4개(송진 바르기, 현 교체, 습도 관리, 활 관리)
- 브랜드 소개(셀렉트 철학), 숫자 지표, 문의 폼(검증 + 접수 메시지)

**품질**
- 360px까지 대응하는 반응형, 키보드 접근성(포커스 트랩·ESC·aria), 모션 최소화 설정 존중
- 인쇄용 스타일(주문 확인서)

## 토스페이먼츠 연동 방법

`payment.js`의 `CONFIG` 세 줄만 채우면 실제 결제로 전환됩니다.

```js
var CONFIG = {
  clientKey: 'test_ck_...',            // 개발자센터에서 발급 (테스트/라이브)
  confirmEndpoint: '/api/payments/confirm',
  successUrl: 'https://elivon.kr/order/success'
};
```

1. 결제창 호출: `requestPayment()`가 TossPayments v2 표준결제창(`CARD`, `TOSSPAY`)을 엽니다.
2. 승인: 결제창이 `successUrl?paymentKey=&orderId=&amount=`로 돌아오면
   `ElivonPay.confirmRedirect()`가 `confirmEndpoint`로 승인을 요청합니다.
   서버에서는 `POST https://api.tosspayments.com/v1/payments/confirm`을
   `Authorization: Basic base64(SECRET_KEY + ':')`로 호출하세요.
   **시크릿 키는 절대 프런트엔드에 넣지 않습니다.**
3. 클라이언트 키가 비어 있으면 자동으로 테스트 시뮬레이션 모드로 동작하며
   실제 금액이 청구되지 않습니다(화면에 `TEST MODE` 표시).

무통장 계좌 정보는 `payment.js`의 `BANK_TRANSFER`에서 실제 계좌로 바꿔 주세요.

## 상품·문구 수정

`data.js`의 `PRODUCTS` 배열만 고치면 목록·모달·장바구니·주문서에 모두 반영됩니다.

- `price` 기본가(원), `options[].values[].delta` 옵션 추가금
- `image` 경로, `imageBg` 타일 배경색, `specs` 스펙 표, `shippingNote` 배송 문구
- 배송 정책: `cart.js`의 `FREE_SHIPPING_THRESHOLD`(100,000원), `SHIPPING_FEE`(4,000원)

## 점검 결과

```bash
# 로직 검사 (Node)
node tools/selftest.cjs      # 28개 검사 · 28 통과

# 브라우저 점검 (Playwright 설치 필요)
python3 tools/e2e.py         # 콘솔 오류 0 · 흐름 이상 0
```

`e2e.py`는 상품 선택 → 옵션 변경(가격 반영) → 장바구니 → 수량 조절 → 주문서 →
필수값 검증 → 테스트 결제 → 완료 화면까지 실제 클릭으로 확인하고,
데스크톱·태블릿·모바일 스크린샷을 `tools/qa/`에 남깁니다.

## 참고

- 상품·브랜드·학습 이미지는 AI로 생성한 뒤 4:5 타일로 합성해 톤을 통일했습니다.
- 문의 폼은 프런트엔드 데모로, 실제 전송은 서버 연동이 필요합니다.
- 히어로 원본 참고 이미지는 `attachments/2026-11-24/`에 그대로 보관되어 있습니다.
