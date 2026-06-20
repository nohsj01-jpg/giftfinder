import {
  calculateMatchScore,
  rankProducts,
  Product,
} from "@/lib/recommendEngine";
import { SurveyData } from "@/types/survey";

describe("recommendEngine - calculateMatchScore", () => {
  // 기본 설문 데이터 템플릿
  const baseSurvey: SurveyData = {
    relationship: "친구",
    gender: "여성",
    age_group: "20대 초반",
    budget: "3~5만원",
    event: "생일",
    hobbies: [],
    personality: [],
    description: "",
  };

  // 기본 상품 데이터 템플릿
  const baseProduct: Partial<Product> = {
    id: 1,
    name: "테스트 상품",
    hobbies: [],
    personality: [],
    price: 30000,
  };

  test("완전 일치 케이스 (hobbies 2개 일치 + personality 2개 일치)", () => {
    const survey = {
      ...baseSurvey,
      hobbies: ["커피/티", "독서"],
      personality: ["감성적", "집순이"],
    };

    const product = {
      ...baseProduct,
      hobbies: ["커피/티", "독서"],
      personality: ["감성적", "집순이"],
    };

    // 취미 매칭: 2개 * 10 = 20점
    // 성격 매칭: 2개 * 8 = 16점
    // 예상 점수 = 36점
    const score = calculateMatchScore(product, survey);
    expect(score).toBe(36);
  });

  test("부분 일치 케이스 및 description 중복 가산 배제 검증", () => {
    const survey = {
      ...baseSurvey,
      hobbies: ["독서"],
      personality: ["감성적"],
      description: "요리를 배우고 있고 활동적인 성향이 잘 어울림. 독서도 좋아함.",
    };

    const product = {
      ...baseProduct,
      hobbies: ["독서", "요리/베이킹"], // '독서'는 정확 매칭, '요리/베이킹'은 부분 포함 매칭 대상
      personality: ["감성적", "활동적"],   // '감성적'은 정확 매칭, '활동적'은 부분 포함 매칭 대상
    };

    // 1. hobbies 교집합: '독서' (+10점)
    // 2. personality 교집합: '감성적' (+8점)
    // 3. description 부분 포함:
    //    - 남은 hobbies: '요리/베이킹' -> description에 '요리' 포함되므로 (+5점)
    //    - 남은 personality: '활동적' -> description에 '활동적' 포함되므로 (+5점)
    //    - 이미 정확 매칭된 '독서'는 description에 '독서'가 있어도 중복 가산 제외됨.
    // 예상 점수 = 10 + 8 + 5 + 5 = 28점
    const score = calculateMatchScore(product, survey);
    expect(score).toBe(28);
  });

  test("0개 매칭 케이스", () => {
    const survey = {
      ...baseSurvey,
      hobbies: ["운동/헬스"],
      personality: ["실용적"],
      description: "아주 조용한 선물을 원해요.",
    };

    const product = {
      ...baseProduct,
      hobbies: ["독서"],
      personality: ["트렌디한"],
    };

    // 매칭 없음 -> 예상 점수 = 0점
    const score = calculateMatchScore(product, survey);
    expect(score).toBe(0);
  });
});

describe("recommendEngine - rankProducts (동점 처리 및 랭킹 정렬)", () => {
  const survey: SurveyData = {
    relationship: "친구",
    gender: "여성",
    age_group: "20대 초반",
    budget: "3~5만원", // 중간값: 40000원
    event: "생일",
    hobbies: ["독서"],
    personality: ["감성적"],
    description: "",
  };

  test("동점인 경우 price가 budget 중간값(40000원)에 가장 가까운 상품이 우선 정렬됨", () => {
    const products: Product[] = [
      {
        id: 1,
        name: "45,000원 상품 (차이 5,000원)",
        category: "식품/커피",
        price_range: "3~5만원",
        price: 45000,
        gender: "여성",
        age_group: "20대 초반",
        relationships: ["친구"],
        hobbies: ["독서"], // 매칭 점수: 10점 (취미 1개)
        personality: [],
        events: ["생일"],
        image_url: null,
        purchase_link: null,
      },
      {
        id: 2,
        name: "38,000원 상품 (차이 2,000원)",
        category: "뷰티",
        price_range: "3~5만원",
        price: 38000,
        gender: "여성",
        age_group: "20대 초반",
        relationships: ["친구"],
        hobbies: ["독서"], // 매칭 점수: 10점 (취미 1개)
        personality: [],
        events: ["생일"],
        image_url: null,
        purchase_link: null,
      },
      {
        id: 3,
        name: "48,000원 상품 (차이 8,000원)",
        category: "IT/테크",
        price_range: "3~5만원",
        price: 48000,
        gender: "여성",
        age_group: "20대 초반",
        relationships: ["친구"],
        hobbies: ["독서"], // 매칭 점수: 10점 (취미 1개)
        personality: [],
        events: ["생일"],
        image_url: null,
        purchase_link: null,
      },
    ];

    // 세 제품 모두 매칭 점수는 10점으로 동점.
    // 3~5만원의 중간값은 40,000원이므로, 40,000원과의 절대적인 가격 차이가 가장 작은
    // id: 2 (38000원, 차이 2000) -> id: 1 (45000원, 차이 5000) -> id: 3 (48000원, 차이 8000) 순서로 랭킹 정렬되어야 함.
    const ranked = rankProducts(products, survey);

    expect(ranked[0].id).toBe(2);
    expect(ranked[1].id).toBe(1);
    expect(ranked[2].id).toBe(3);
  });
});
