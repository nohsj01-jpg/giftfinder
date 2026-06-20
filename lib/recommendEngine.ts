import { SurveyData } from "@/types/survey";

export interface Product {
  id: string | number;
  name: string;
  category: string;
  price_range: string;
  price: number;
  gender: string;
  age_group: string;
  relationships: string[];
  hobbies: string[];
  personality: string[];
  events: string[];
  image_url: string | null;
  purchase_link: string | null;
}

// Supabase giftfinder 한글 컬럼 로우를 영문 표준 Product 인터페이스로 변환
export function mapDbToProduct(dbRow: any): Product {
  if (!dbRow) {
    throw new Error("DB row is null or undefined");
  }

  // 앞뒤 따옴표 및 공백 제거 헬퍼
  const cleanStr = (val: any): string => {
    if (val === null || val === undefined) return "";
    return String(val).replace(/^"|"$/g, "").trim();
  };

  // 콤마 쪼개기 안전 헬퍼
  const safeSplit = (val: any): string[] => {
    const cleaned = cleanStr(val);
    if (!cleaned) return [];
    return cleaned.split(",").map((s) => s.trim()).filter(Boolean);
  };

  return {
    id: cleanStr(dbRow.상품명),
    name: cleanStr(dbRow.상품명),
    category: cleanStr(dbRow.카테고리),
    price_range: cleanStr(dbRow.가격),
    price: Number(dbRow.실제가격) || 0,
    gender: cleanStr(dbRow["추천 성별"]),
    age_group: cleanStr(dbRow["추천 연령대"]),
    relationships: safeSplit(dbRow["추천 관계"]),
    hobbies: safeSplit(dbRow["추천 취미"]),
    personality: safeSplit(dbRow["추천 성격"]),
    events: safeSplit(dbRow["추천 이벤트"]),
    image_url: cleanStr(dbRow.이미지URL) || null,
    purchase_link: cleanStr(dbRow.구매링크) || null,
  };
}


// 예산별 중간값(median) 구하기
export function getBudgetMedian(budget: string): number {
  switch (budget) {
    case "1만원 이하":
      return 5000;
    case "1~3만원":
      return 20000;
    case "3~5만원":
      return 40000;
    case "5~10만원":
      return 75000;
    case "10만원 이상":
      return 150000;
    default:
      return 0;
  }
}

// 가중치 매칭 점수 계산 순수 함수
export function calculateMatchScore(
  product: Partial<Product>,
  surveyData: SurveyData
): number {
  let score = 0;

  const prodHobbies = product.hobbies || [];
  const prodPersonality = product.personality || [];
  const surveyHobbies = surveyData.hobbies || [];
  const surveyPersonality = surveyData.personality || [];
  const description = surveyData.description || "";

  // 가중치 설정 (기본값: 취미 10, 성격 8, 서브매칭 5)
  const hobbyWeight = surveyData.weights?.hobby !== undefined ? surveyData.weights.hobby : 10;
  const personalityWeight = surveyData.weights?.personality !== undefined ? surveyData.weights.personality : 8;
  const descriptionWeight = surveyData.weights?.description !== undefined ? surveyData.weights.description : 5;

  // 1. 취미 교집합 매칭: 1개당 가중치 부여
  const matchedHobbies = prodHobbies.filter((h) => surveyHobbies.includes(h));
  score += matchedHobbies.length * hobbyWeight;

  // 2. 성격 교집합 매칭: 1개당 가중치 부여
  const matchedPersonality = prodPersonality.filter((p) => surveyPersonality.includes(p));
  score += matchedPersonality.length * personalityWeight;

  // 3. description 부분 일치 매칭
  // 단, 이미 정확히 매칭된(교집합인) 키워드는 중복 가산 제외
  const remainingHobbies = prodHobbies.filter((h) => !surveyHobbies.includes(h));
  const remainingPersonality = prodPersonality.filter((p) => !surveyPersonality.includes(p));

  const checkSubMatch = (keyword: string) => {
    if (!keyword) return false;
    // 슬래시, 공백, 쉼표 등으로 쪼갠 뒤 공백 제거
    const parts = keyword.split(/[\/\s,]+/).filter(Boolean);
    // 한 글자는 오탐이 잦으므로 최소 2글자 이상 일치 조건 체크
    return parts.some((part) => part.length >= 2 && description.includes(part));
  };

  remainingHobbies.forEach((h) => {
    if (checkSubMatch(h)) {
      score += descriptionWeight;
    }
  });

  remainingPersonality.forEach((p) => {
    if (checkSubMatch(p)) {
      score += descriptionWeight;
    }
  });

  return score;
}

// 상품 스코어 랭킹 정렬 및 동점 처리 헬퍼
export function rankProducts(
  products: Product[],
  surveyData: SurveyData
): Product[] {
  const median = getBudgetMedian(surveyData.budget);

  // 스코어를 부여하여 리스트로 맵핑
  const scored = products.map((prod) => ({
    product: prod,
    score: calculateMatchScore(prod, surveyData),
  }));

  // 정렬 규칙: 1순위 스코어 내림차순, 2순위 예산 중간값과의 차이 오름차순
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const diffA = Math.abs(a.product.price - median);
    const diffB = Math.abs(b.product.price - median);
    return diffA - diffB;
  });

  return scored.map((s) => s.product);
}
