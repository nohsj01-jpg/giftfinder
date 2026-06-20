import { SurveyData, Recommendation } from "@/types/survey";

// 1.5초 대기 딜레이 함수
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getRecommendations(
  surveyData: SurveyData
): Promise<Recommendation[]> {
  // 실제 API 호출 딜레이 모사
  await delay(1500);

  // 성별이나 나이, 관계 등에 맞춘 그럴듯한 멘트 조합용 변수
  const relation = surveyData.relationship || "소중한 분";
  const age = surveyData.age_group || "해당 연령대";
  const eventName = surveyData.event || "특별한 날";

  // 더미 추천 결과 5개 생성
  return [
    {
      id: "rec-1",
      name: "아로마 오일 테라피 디퓨저 & 스트레스 릴리프 세트",
      category: "뷰티/바디케어",
      price: "34,900원",
      recommendationComment: `바쁜 일상 속에서 편안한 휴식을 원하는 ${relation}에게 안성맞춤인 선물입니다. ${surveyData.personality.join(
        ", "
      )} 성향을 가진 분들의 마음에 깊은 힐링을 선사할 향기 테라피 세트입니다.`,
      tags: ["힐링", "테라피", "디퓨저"],
    },
    {
      id: "rec-2",
      name: "프리미엄 싱글 오리진 드립백 커피 & 머그컵 기프트 패키지",
      category: "식품/리빙",
      price: "28,000원",
      recommendationComment: `${surveyData.hobbies.includes("커피/티") ? "커피를 즐겨 드시는" : "차분한 시간을 즐기는"} ${relation}의 취향을 완벽하게 저격하는 구성입니다. 홈카페 인테리어 소품으로도 훌륭한 고감도 패키지 디자인이 돋보입니다.`,
      tags: ["홈카페", "커피", "디자이너스"],
    },
    {
      id: "rec-3",
      name: "무선 스마트 고속 충전 오브제 무드등",
      category: "IT/테크",
      price: "45,000원",
      recommendationComment: "실용성과 감성 인테리어를 동시에 잡은 선물입니다. 침대 옆이나 책상 위에 두고 스마트폰 충전과 따뜻한 무드등 역할을 동시에 수행하여 일상적인 편리함을 선사합니다.",
      tags: ["테크", "무드등", "실용적"],
    },
    {
      id: "rec-4",
      name: "비건 가죽 미니 데일리 저널 & 만년필 기프트 에디션",
      category: "문구/오피스",
      price: "22,500원",
      recommendationComment: `생각을 정리하고 일상을 기록하기 좋은 다이어리 세트입니다. ${surveyData.personality.includes("꼼꼼한") ? "평소 계획적인 메모를 좋아하는 분에게" : "영감을 기록하기 좋아하는 분에게"} 강력하게 권장해 드립니다.`,
      tags: ["문구", "저널", "기록"],
    },
    {
      id: "rec-5",
      name: "미니 하우스 펫 / 포터블 반려식물 웰컴 키트",
      category: "리빙/반려식물",
      price: "19,800원",
      recommendationComment: `최근 ${eventName} 등의 특별한 계기로 새로운 활력이 필요한 ${relation}에게 키우는 재미를 선사하는 미니 가드닝 세트입니다. 초보자도 쉽게 가꿀 수 있도록 구성되어 있습니다.`,
      tags: ["식물", "가드닝", "웰컴키트"],
    },
  ];
}
