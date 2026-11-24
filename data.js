/* ==========================================================================
   ÉLIVON — 상품 카탈로그 데이터
   --------------------------------------------------------------------------
   이 파일만 수정하면 쇼핑몰의 상품 구성이 바뀝니다.
   · price      : 기본가(원). 옵션의 delta 값이 더해져 최종 단가가 됩니다.
   · category   : 'violin' | 'cello' | 'bow' | 'accessories'
   · options    : [{ name: '사이즈', values: [{ label, delta }] }]
                  첫 번째 값이 기본 선택됩니다.
   ========================================================================== */

(function (root) {
  'use strict';

  var CATEGORIES = [
    { id: 'all', label: '전체', en: 'All' },
    { id: 'violin', label: '바이올린', en: 'Violin' },
    { id: 'cello', label: '첼로', en: 'Cello' },
    { id: 'bow', label: '활', en: 'Bow' },
    { id: 'accessories', label: '보조품', en: 'Accessories' }
  ];

  var PRODUCTS = [
    {
      id: 'violin-aurora',
      imageBg: '#F2E9DC',
      category: 'violin',
      name: 'Aurora',
      nameKo: '오로라',
      subtitle: '콘서트 그레이드 바이올린',
      price: 2850000,
      image: 'assets/p-violin-aurora.jpg',
      imageAlt: '따뜻한 호박색 바니시의 ÉLIVON 오로라 바이올린 전면',
      specLine: '유럽 스프루스 · 메이플 · 4/4',
      badge: '베스트',
      summary:
        '따뜻하고 넓게 퍼지는 소리. 첫 콘서트 악기로 가장 많이 선택되는 모델입니다.',
      description: [
        'ÉLIVON의 스탠더드 모델. 5년 이상 자연 건조한 유럽 스프루스 앞판과 플레임 메이플로 옆판과 뒷판을 맞춥니다. 나무가 오래 마른 만큼 첫 음부터 소리가 열려 있고, 연주할수록 배음이 두터워집니다.',
        '낮은 현에서 올라오는 저음이 풍부하면서도 3옥타브 이상의 고음역에서 소리가 가늘어지지 않습니다. 실내악과 협주 모두에서 균형 잡힌 응답을 보이며, 활의 무게를 그대로 받아 주는 편안한 감도를 지녔습니다.',
        '모든 악기는 입고 후 넉 주의 셋업 기간을 거친 뒤 출고되며, 구매 후 1년간 계절별 무상 셋업을 제공합니다.'
      ],
      specs: [
        ['앞판', '유럽 스프루스 (자연 건조 5년 이상)'],
        ['뒷판 · 옆판', '플레임 메이플'],
        ['지판', '에보니'],
        ['브릿지', '오베르빌 스타일, 너도밤나무'],
        ['바니시', '천연 오일-레진, 새틴 마감'],
        ['현', 'ÉLIVON Signature 미디엄'],
        ['무게', '약 430g (4/4 기준)'],
        ['구성', '하드케이스 · 활 · 어깨받침 · 송진']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '4/4', delta: 0 },
            { label: '3/4', delta: -180000 }
          ]
        },
        {
          name: '마감',
          values: [
            { label: 'Natural Amber', delta: 0 },
            { label: 'Antique Brown', delta: 90000 }
          ]
        }
      ],
      shippingNote: '주문 후 셋업·조율을 거쳐 7–10일 내 발송'
    },
    {
      id: 'violin-nocturne',
      imageBg: '#F2E9DC',
      category: 'violin',
      name: 'Nocturne',
      nameKo: '녹턴',
      subtitle: '시그니처 콘서트 바이올린',
      price: 3200000,
      image: 'assets/p-violin-nocturne.jpg',
      imageAlt: '짙은 월넛 바니시의 ÉLIVON 녹턴 바이올린 전면',
      specLine: '유럽 스프루스 · 플레임 메이플 · 4/4',
      badge: '시그니처',
      summary:
        '짙은 월넛 색과 깊은 저음. 무대의 조명 아래에서 가장 아름다운 모델입니다.',
      description: [
        '녹턴은 ÉLIVON의 시그니처 모델입니다. 진공 건조 8년의 스프루스를 얇게 다듬어 앞판의 진동을 최대한 살리고, 짙은 월넛 바니시로 마감했습니다.',
        '저음현의 응답이 빠르고 어두운 색채를 지녀, 낭만주의 협주곡이나 실내악에서 특히 힘을 발휘합니다. 큰 홀에서도 소리가 뭉치지 않고 끝까지 뻗어 나가는 것이 이 악기의 가장 큰 장점입니다.',
        '주문 시 연주자의 신체 조건과 연주 스타일에 맞춘 넥 각도 조정을 무상으로 진행합니다.'
      ],
      specs: [
        ['앞판', '유럽 스프루스 (진공 건조 8년)'],
        ['뒷판 · 옆판', '플레임 메이플'],
        ['지판', '에보니'],
        ['브릿지', '오베르빌 스타일, 너도밤나무'],
        ['바니시', 'Deep Walnut, 글로시'],
        ['현', 'ÉLIVON Signature 하드'],
        ['무게', '약 445g (4/4 기준)'],
        ['구성', '하드케이스 · 활 · 어깨받침 · 송진']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '4/4', delta: 0 },
            { label: '3/4', delta: -200000 }
          ]
        },
        {
          name: '마감',
          values: [
            { label: 'Deep Walnut', delta: 0 },
            { label: 'Espresso', delta: 120000 }
          ]
        }
      ],
      shippingNote: '주문 후 셋업·조율을 거쳐 10–14일 내 발송'
    },
    {
      id: 'violin-esprit',
      imageBg: '#F2E9DC',
      category: 'violin',
      name: 'Esprit',
      nameKo: '에스프리',
      subtitle: '스튜던트 바이올린',
      price: 1450000,
      image: 'assets/p-violin-esprit.jpg',
      imageAlt: '꿀빛 바니시의 ÉLIVON 에스프리 스튜던트 바이올린',
      specLine: '스프루스 · 메이플 · 3/4',
      summary:
        '처음 시작하는 연주자를 위한 악기. 배우기 쉬운 감도와 단단한 소리.',
      description: [
        '에스프리는 배움의 첫 몇 년을 함께 견디도록 고른 악기입니다. 소리가 지나치게 무겁지 않아 어린 연주자도 쉽게 활을 얹을 수 있고, 음정이 안정적이어서 귀를 기르는 데 도움이 됩니다.',
        '나무는 스탠더드 모델과 같은 유럽 스프루스와 메이플을 쓰되, 마감을 단순하게 한 모델로 가격을 낮췄습니다. 성장에 맞춰 사이즈를 바꿀 때는 구매가의 60%를 보상 판매로 돌려드립니다.',
        '교재와 함께 쓰기 좋은 기본 케이스와 어깨받침이 포함됩니다.'
      ],
      specs: [
        ['앞판', '유럽 스프루스'],
        ['뒷판 · 옆판', '메이플'],
        ['지판', '에보니'],
        ['바니시', 'Honey Satin'],
        ['현', 'ÉLIVON Student 미디엄'],
        ['무게', '약 400g (3/4 기준)'],
        ['구성', '경량 케이스 · 활 · 어깨받침']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '3/4', delta: 0 },
            { label: '1/2', delta: -120000 },
            { label: '4/4', delta: 150000 }
          ]
        }
      ],
      shippingNote: '주문 후 셋업·조율을 거쳐 5–7일 내 발송'
    },
    {
      id: 'cello-sonata',
      imageBg: '#F2E9DC',
      category: 'cello',
      name: 'Sonata',
      nameKo: '소나타',
      subtitle: '플래그십 첼로',
      price: 5800000,
      image: 'assets/p-cello-sonata.jpg',
      imageAlt: '호박색 바니시의 ÉLIVON 소나타 첼로 전면',
      specLine: '유럽 스프루스 · 메이플 · 4/4',
      badge: '플래그십',
      summary:
        '낮고 긴 울림, 첼로의 정석. ÉLIVON 셀렉션의 플래그십 모델입니다.',
      description: [
        '소나타는 ÉLIVON 셀렉션에서 가장 오랜 시간을 들여 고른 첼로입니다. 앞판은 유럽 스프루스, 뒷판은 한 조각 메이플로 잘라 목리의 결이 좌우로 이어지도록 맞춘 모델입니다.',
        '낮은 C현의 울림이 깊고 오래 남으며, A현으로 올라가도 음색이 뚜렷하게 유지됩니다. 앙상블에서 저음을 단단히 받치면서도 독주에서 충분히 노래할 수 있는 균형을 목표로 했습니다.',
        '입고와 셋업에 약 여덟 주가 걸리며, 주문 후 일정을 개별로 안내드립니다.'
      ],
      specs: [
        ['앞판', '유럽 스프루스 (자연 건조 6년 이상)'],
        ['뒷판 · 옆판', '원피스 메이플'],
        ['지판', '에보니'],
        ['바니시', 'Amber Oil, 새틴'],
        ['현', 'ÉLIVON Signature 첼로 미디엄'],
        ['무게', '약 2.9kg (4/4 기준)'],
        ['구성', '하드케이스 · 첼로 활 · 송진'],
        ['준비 기간', '약 8주 (입고·셋업)']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '4/4', delta: 0 },
            { label: '7/8', delta: -300000 }
          ]
        },
        {
          name: '마감',
          values: [
            { label: 'Amber', delta: 0 },
            { label: 'Cognac', delta: 150000 }
          ]
        }
      ],
      shippingNote: '입고·셋업 완료 후 안전 배송 또는 방문 인도'
    },
    {
      id: 'cello-petit',
      imageBg: '#F2E9DC',
      category: 'cello',
      name: 'Petit Sonata',
      nameKo: '쁘띠 소나타',
      subtitle: '스튜던트 첼로',
      price: 3900000,
      image: 'assets/p-cello-petit.jpg',
      imageAlt: '연한 꿀빛 바니시의 ÉLIVON 쁘띠 소나타 첼로',
      specLine: '스프루스 · 메이플 · 3/4',
      summary:
        '성장하는 연주자를 위한 첼로. 가볍고 다루기 쉬우면서 소리는 단단합니다.',
      description: [
        '쁘띠 소나타는 3/4과 1/2 사이즈로 나오는 학습용 첼로입니다. 악기 전체의 무게를 줄여 오랜 연습에도 부담이 적고, 지판과 넥의 각도를 학생의 손 크기에 맞춰 조정합니다.',
        '소리는 성인용 모델에 비해 밝고 곧게 뻗습니다. 앙상블 수업이나 첫 독주회에서 다른 악기와 섞이지 않도록 중음역을 또렷하게 다듬었습니다.',
        '사이즈가 바뀔 때 구매가의 60%를 보상 판매로 돌려드립니다.'
      ],
      specs: [
        ['앞판', '유럽 스프루스'],
        ['뒷판 · 옆판', '메이플'],
        ['지판', '에보니'],
        ['바니시', 'Honey Oil, 새틴'],
        ['현', 'ÉLIVON Student 첼로'],
        ['무게', '약 2.4kg (3/4 기준)'],
        ['구성', '경량 하드케이스 · 첼로 활 · 송진']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '3/4', delta: 0 },
            { label: '1/2', delta: -250000 }
          ]
        }
      ],
      shippingNote: '주문 후 셋업·조율을 거쳐 7–10일 내 발송'
    },
    {
      id: 'bow-violin-signature',
      imageBg: '#F2E9DC',
      category: 'bow',
      name: 'Signature Bow',
      nameKo: '시그니처 바이올린 활',
      subtitle: '페르남부쿠 바이올린 활',
      price: 620000,
      image: 'assets/p-bow-violin.jpg',
      imageAlt: '페르남부쿠 스틱과 실버 마운트의 ÉLIVON 바이올린 활',
      specLine: '페르남부쿠 · 실버 마운트 · 4/4',
      summary:
        '손목의 힘을 그대로 전하는 활. 스틱의 균형을 한 자루씩 손으로 맞춥니다.',
      description: [
        '페르남부쿠 원목을 곧게 편 스틱에 실버 마운트 에보니 프로그를 얹었습니다. 무게 중심을 살짝 앞쪽에 두어 활 끝에서도 소리가 얇아지지 않습니다.',
        '말총은 화이트 소재를 사용했으며, 구매 시 첫 송진 작업을 마친 상태로 보내드립니다.',
        '활은 습도에 민감합니다. 사용 후 반드시 말총의 장력을 풀고 케이스에 보관해 주세요.'
      ],
      specs: [
        ['스틱', '페르남부쿠 (직선결)'],
        ['프로그', '에보니 · 실버 마운트'],
        ['말총', '화이트, 180모'],
        ['무게', '약 59g'],
        ['길이', '742mm'],
        ['밸런스', '표준 (중심 245mm)']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '4/4', delta: 0 },
            { label: '3/4', delta: -40000 }
          ]
        },
        {
          name: '밸런스',
          values: [
            { label: '표준', delta: 0 },
            { label: '가벼운', delta: 0 }
          ]
        }
      ],
      shippingNote: '주문 후 3–5일 내 발송'
    },
    {
      id: 'bow-cello-signature',
      imageBg: '#F2E9DC',
      category: 'bow',
      name: 'Signature Cello Bow',
      nameKo: '시그니처 첼로 활',
      subtitle: '페르남부쿠 첼로 활',
      price: 980000,
      image: 'assets/p-bow-cello.jpg',
      imageAlt: '페르남부쿠 스틱의 ÉLIVON 첼로 활',
      specLine: '페르남부쿠 · 에보니 · 4/4',
      summary:
        '낮은 현을 깊이 끌어내는 활. 묵직한 소리를 원하는 연주자에게.',
      description: [
        '첼로 활은 바이올린 활보다 무겁고 긴 호흡이 필요합니다. 시그니처 첼로 활은 스틱의 끝으로 갈수록 가늘어지는 테이퍼를 완만하게 잡아, 긴 활을 쓰는 동안 압력이 고르게 유지됩니다.',
        '프로그는 에보니에 실버 링을 두르고, 그립감을 위해 가죽을 덧댔습니다.',
        '구매 후 첫 재털이(리헤어) 1회를 무상으로 제공합니다.'
      ],
      specs: [
        ['스틱', '페르남부쿠'],
        ['프로그', '에보니 · 실버 링'],
        ['말총', '화이트, 200모'],
        ['무게', '약 82g'],
        ['길이', '715mm'],
        ['밸런스', '표준']
      ],
      options: [
        {
          name: '사이즈',
          values: [{ label: '4/4', delta: 0 }]
        }
      ],
      shippingNote: '주문 후 3–5일 내 발송'
    },
    {
      id: 'acc-rosin',
      imageBg: '#F2E9DC',
      category: 'accessories',
      name: 'Rosin No.1',
      nameKo: '로진 No.1',
      subtitle: 'ÉLIVON 시그니처 송진',
      price: 38000,
      image: 'assets/p-rosin.jpg',
      imageAlt: '린넨 케이스에 담긴 ÉLIVON 로진',
      specLine: '스탠더드 · 30g',
      badge: '필수품',
      summary:
        '여름의 눅눅한 날에도 뭉치지 않는 배합. 소리의 결을 가장 투명하게 만듭니다.',
      description: [
        'ÉLIVON 로진 No.1은 송진과 밀랍의 비율을 조정해 먼지가 적고 발림이 고른 것이 특징입니다. 활털에 얇게 얹히면서도 충분한 마찰을 만들어, 소리가 거칠어지지 않습니다.',
        '린넨으로 감싼 원목 케이스에 담아 보내드리며, 사용 후에는 뚜껑을 닫아 서늘한 곳에 보관해 주세요.',
        'No.2 라이트는 습도가 높은 여름철이나 실내 온도가 높은 공연장에 적합합니다.'
      ],
      specs: [
        ['중량', '30g'],
        ['조성', '천연 송진 · 밀랍'],
        ['케이스', '린넨 · 메이플'],
        ['권장', '봄·가을, 실내 20–24°C']
      ],
      options: [
        {
          name: '타입',
          values: [
            { label: 'No.1 스탠더드', delta: 0 },
            { label: 'No.2 라이트', delta: 2000 }
          ]
        }
      ],
      shippingNote: '주문 후 2–3일 내 발송'
    },
    {
      id: 'acc-shoulder-rest',
      imageBg: '#F2E9DC',
      category: 'accessories',
      name: 'Rest Ébène',
      nameKo: '레스트 에벤',
      subtitle: '어깨받침',
      price: 145000,
      image: 'assets/p-shoulder-rest.jpg',
      imageAlt: '에보니와 가죽 패드로 만든 ÉLIVON 어깨받침',
      specLine: '에보니 · 가죽 패드 · 높이 조절',
      summary:
        '어깨에 닿는 면을 부드럽게. 악기를 턱 아래에 자연스럽게 얹어 줍니다.',
      description: [
        '어깨받침은 연주 자세의 절반을 결정합니다. 레스트 에벤은 에보니 프레임에 얇은 가죽 패드를 덧대어 옷이 미끄러지지 않고, 악기가 어깨에 닿는 각도를 편안하게 유지해 줍니다.',
        '다리 높이는 3cm에서 6cm까지 조절할 수 있어 체형에 맞게 세팅할 수 있습니다.',
        '구매 시 악기에 맞춘 각도 조정을 함께 해 드립니다.'
      ],
      specs: [
        ['프레임', '에보니'],
        ['패드', '천연 가죽'],
        ['높이', '3–6cm 조절'],
        ['무게', '약 58g'],
        ['호환', '4/4 – 1/2 바이올린 · 비올라']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '4/4', delta: 0 },
            { label: '3/4–1/2', delta: 0 }
          ]
        },
        {
          name: '소재',
          values: [
            { label: '에보니', delta: 0 },
            { label: '메이플', delta: 15000 }
          ]
        }
      ],
      shippingNote: '주문 후 2–3일 내 발송'
    },
    {
      id: 'acc-strings',
      imageBg: '#F2E9DC',
      category: 'accessories',
      name: 'Signature Strings',
      nameKo: '시그니처 현',
      subtitle: '현 4개 세트',
      price: 96000,
      image: 'assets/p-strings.jpg',
      imageAlt: '종이 봉투에 담긴 ÉLIVON 시그니처 바이올린 현 세트',
      specLine: '은권선 · 미디엄 · 4개 세트',
      summary:
        'ÉLIVON 악기에 맞춰 고른 장력. 갈아 끼운 뒤 가장 빨리 자리를 잡습니다.',
      description: [
        '시그니처 현은 ÉLIVON 악기의 앞판 두께와 브릿지에 맞춰 장력을 조정한 세트입니다. 새 현으로 바꾼 뒤 안정되는 시간이 짧아, 공연 전날 교체해도 다음 날 바로 연주할 수 있습니다.',
        'E현은 은권선으로 부드러운 음색을, G현은 단단한 코어로 깊은 저음을 냅니다.',
        '현은 3–6개월마다 교체를 권장하며, 연주 시간이 긴 경우 3개월을 기준으로 삼으세요.'
      ],
      specs: [
        ['구성', 'G · D · A · E 4개'],
        ['E현', '은권선'],
        ['장력', '미디엄 (하드 선택 가능)'],
        ['소재', '합성 코어 · 은권선'],
        ['호환', '바이올린 4/4 – 3/4']
      ],
      options: [
        {
          name: '악기',
          values: [
            { label: '바이올린', delta: 0 },
            { label: '첼로', delta: 45000 }
          ]
        },
        {
          name: '게이지',
          values: [
            { label: '미디엄', delta: 0 },
            { label: '하드', delta: 5000 }
          ]
        }
      ],
      shippingNote: '주문 후 2–3일 내 발송'
    },
    {
      id: 'acc-case',
      imageBg: '#F2E9DC',
      category: 'accessories',
      name: 'Signature Case',
      nameKo: '시그니처 케이스',
      subtitle: '가죽 하드케이스',
      price: 420000,
      image: 'assets/p-case.jpg',
      imageAlt: '코냑색 가죽과 황동 잠금장치의 ÉLIVON 바이올린 케이스',
      specLine: '천연 가죽 · 벨벳 내장 · 하드',
      summary:
        '악기를 다루는 시간까지 아름답게. 습도 변화를 늦춰 주는 두꺼운 하드 케이스.',
      description: [
        '시그니처 케이스는 천연 가죽 외피와 두꺼운 단열층으로 온도와 습도의 급격한 변화를 막아 줍니다. 내부는 벨벳으로 마감해 바니시에 흠이 생기지 않습니다.',
        '악기 본체 외에 활 두 자루, 어깨받침, 송진, 악보를 함께 넣을 수 있습니다.',
        '황동 잠금장치는 손으로 조정할 수 있어 오래 사용해도 헐거워지지 않습니다.'
      ],
      specs: [
        ['외피', '천연 가죽'],
        ['내장', '코튼 벨벳'],
        ['무게', '약 2.1kg'],
        ['수납', '활 2자루 · 악보 포켓'],
        ['색상', 'Cognac · Noir · Olive']
      ],
      options: [
        {
          name: '색상',
          values: [
            { label: 'Cognac', delta: 0 },
            { label: 'Noir', delta: 0 },
            { label: 'Olive', delta: 20000 }
          ]
        }
      ],
      shippingNote: '주문 후 3–5일 내 발송'
    },
    {
      id: 'acc-humidifier',
      imageBg: '#F2E9DC',
      category: 'accessories',
      name: 'Signature Humidifier',
      nameKo: '시그니처 가습기',
      subtitle: '악기용 가습기',
      price: 32000,
      image: 'assets/p-humidifier.jpg',
      imageAlt: '메이플 목재와 황동 마개의 ÉLIVON 악기용 가습기',
      specLine: '메이플 · 황동 · 12ml',
      summary:
        '겨울철 건조한 방에서 악기를 지키는 가장 작은 장치. f홀에 걸어 두세요.',
      description: [
        '현악기는 습도 45–55%에서 가장 안정적입니다. 난방을 켜는 계절에는 실내 습도가 30% 아래로 떨어지며, 이때 나무가 수축해 접착부가 벌어질 수 있습니다.',
        '시그니처 가습기는 메이플 원목 몸체에 물을 채워 f홀 사이에 걸어 두는 방식입니다. 물이 천천히 증발하며 케이스 안의 습도를 하루 정도 유지합니다.',
        '사용 전 물을 12ml까지 채우고, 하루 이상 사용하지 않을 때는 비워 주세요.'
      ],
      specs: [
        ['재질', '메이플 · 황동'],
        ['용량', '12ml'],
        ['지속', '약 24시간'],
        ['호환', '바이올린 · 비올라 · 첼로 f홀']
      ],
      options: [
        {
          name: '사이즈',
          values: [
            { label: '바이올린 · 비올라', delta: 0 },
            { label: '첼로', delta: 6000 }
          ]
        }
      ],
      shippingNote: '주문 후 2–3일 내 발송'
    }
  ];

  var api = { CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ELIVON_DATA = api;
})(typeof window !== 'undefined' ? window : globalThis);
