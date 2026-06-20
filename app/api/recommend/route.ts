import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseDirect } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { SurveyData, Recommendation } from "@/types/survey";
import { rankProducts, Product, mapDbToProduct } from "@/lib/recommendEngine";

// Next.js 정적 캐싱 무력화 및 강제 동적 서빙 선언
export const dynamic = "force-dynamic";

// API 키 탐색
const apiKey = 
  process.env.GEMINI_API_KEY || 
  process.env.GOOGLE_API_KEY || 
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Google Gen AI 클라이언트 인스턴스 초기화
const getGoogleGenAIClient = () => {
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI Client:", e);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const surveyData = (await req.json()) as SurveyData;

    if (!surveyData) {
      return NextResponse.json(
        { error: "설문 데이터가 제공되지 않았습니다." },
        { status: 400 }
      );
    }
    // [디버그 로그] 수신된 설문 데이터 출력
    console.log("📥 수신된 추천 설문 데이터:", JSON.stringify(surveyData, null, 2));

    // RLS 우회를 위해 서버 측에서 Service Role Key를 사용한 단독 인스턴스 기동
    const supabase = createSupabaseDirect(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // [1단계 쿼리] 가장 엄격한 조건으로 1차 필터링
    console.log("🔍 [1단계 쿼리] 엄격 조건 검색 시작...");
    const { data: rawRows, error: dbError } = await supabase
      .from("giftfinder")
      .select("*")
      .eq("가격", surveyData.budget)
      .in("추천 성별", [surveyData.gender, "상관없음"])
      .eq("추천 연령대", surveyData.age_group)
      .like("추천 관계", `%${surveyData.relationship}%`)
      .or(`"추천 이벤트".ilike.%${surveyData.event}%,"추천 이벤트".ilike.%"특별한 이유 없음"%`);

    if (dbError) {
      console.error("❌ Supabase 1단계 Query Error:", dbError.message);
      return NextResponse.json(
        { error: `상품 조회 오류: ${dbError.message}` },
        { status: 500 }
      );
    }

    let products: Product[] = [];
    if (rawRows && rawRows.length > 0) {
      products = rawRows.map(mapDbToProduct);
      console.log(`✅ [1단계 성공] ${products.length}개 매칭 완료.`);
    }

    // [2단계 쿼리] 관계/이벤트 조건 완화하여 예산, 성별, 연령대 3종 필터로 재조회
    if (products.length === 0) {
      console.log("⚠️ [2단계 쿼리] 검색 결과 0개. 관계/이벤트 필터 제거 후 재조회...");
      try {
        const { data: looseRows, error: looseError } = await supabase
          .from("giftfinder")
          .select("*")
          .eq("가격", surveyData.budget)
          .in("추천 성별", [surveyData.gender, "상관없음"])
          .eq("추천 연령대", surveyData.age_group);

        if (!looseError && looseRows && looseRows.length > 0) {
          products = looseRows.map(mapDbToProduct);
          console.log(`✅ [2단계 성공] ${products.length}개 매칭 완료.`);
        }
      } catch (e) {
        console.error("❌ [2단계 쿼리] 예외 발생:", e);
      }
    }

    // [3단계 쿼리] 예산 구간 한 단계 확장하여 넓은 검색
    if (products.length === 0) {
      console.log(`⚠️ [3단계 쿼리] 검색 결과 0개. 예산 범위 [${surveyData.budget}] 확장 재시도...`);
      const budgetStages = ["1만원 이하", "1~3만원", "3~5만원", "5~10만원", "10만원 이상"];
      const currentIndex = budgetStages.indexOf(surveyData.budget);
      const expandedBudgets = [surveyData.budget];

      if (currentIndex > 0) {
        expandedBudgets.push(budgetStages[currentIndex - 1]);
      }
      if (currentIndex < budgetStages.length - 1) {
        expandedBudgets.push(budgetStages[currentIndex + 1]);
      }

      try {
        const { data: retryRows, error: retryError } = await supabase
          .from("giftfinder")
          .select("*")
          .in("가격", expandedBudgets)
          .in("추천 성별", [surveyData.gender, "상관없음"])
          .eq("추천 연령대", surveyData.age_group);

        if (!retryError && retryRows && retryRows.length > 0) {
          products = retryRows.map(mapDbToProduct);
          console.log(`✅ [3단계 성공] ${products.length}개의 상품 발견.`);
        }
      } catch (retryException) {
        console.error("❌ [3단계 쿼리] 예외 발생:", retryException);
      }
    }

    // [4단계 쿼리] 최후 수단: 데이터베이스에서 30개 전체 무작위 로드
    if (products.length === 0) {
      console.log("⚠️ [4단계 쿼리] 확장 재검색도 실패하여 전체 DB 백업 로드합니다.");
      try {
        const { data: fallbackRows, error: fallbackError } = await supabase
          .from("giftfinder")
          .select("*")
          .limit(30);

        if (fallbackError || !fallbackRows) {
          console.error("❌ DB가 완전히 비어있거나 연결 끊김.");
          return NextResponse.json(
            { error: "상품 데이터베이스가 비어있습니다." },
            { status: 404 }
          );
        }
        products = fallbackRows.map(mapDbToProduct);
        console.log(`✅ [4단계 성공] 무작위 백업 ${products.length}개 로드 완료.`);
      } catch (dbException) {
        console.error("❌ [4단계 쿼리] 예외 발생:", dbException);
        return NextResponse.json(
          { error: "데이터베이스 연결에 완전히 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // 2. 가중치 기반 스코어 매칭 및 동점 처리 랭킹 정렬 실행
    const top5Products = rankProducts(products, surveyData);
    const top5 = top5Products.slice(0, 5);


    // 3. AI 기반 추천사(멘트) 일괄 생성 프로세스
    const aiClient = getGoogleGenAIClient();
    let recommendations: Recommendation[] = [];

    if (aiClient) {
      try {
        // 매칭된 키워드 정보 추출 (hobbies & personality 교집합 추출)
        const top5WithKeywords = top5.map((prod) => {
          const matchedHobbies = prod.hobbies.filter((h) => surveyData.hobbies.includes(h));
          const matchedPersonality = prod.personality.filter((p) => surveyData.personality.includes(p));
          const matchedKeywords = [...matchedHobbies, ...matchedPersonality];
          return {
            name: prod.name,
            category: prod.category,
            price: `${prod.price.toLocaleString()}원`,
            matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : ["기본 맞춤"],
          };
        });

        const prompt = `
          사용자의 설문 및 매칭 키워드를 바탕으로 아래 5개 상품에 대해 각각 1~2문장의 자연스럽고 따뜻한 추천 멘트와 관련 태그 3개를 생성해 주세요.
          
          [사용자 설문 정보]
          - 받는 분과의 관계: ${surveyData.relationship}
          - 성별: ${surveyData.gender}
          - 연령대: ${surveyData.age_group}
          - 예산 범위: ${surveyData.budget}
          - 선물 목적(이벤트): ${surveyData.event}
          - 추가 설명: ${surveyData.description || "없음"}

          [선정된 추천 상품 상세 및 매칭 키워드 리스트]
          ${top5WithKeywords
            .map(
              (p, i) =>
                `${i + 1}. [상품명]: ${p.name} | [카테고리]: ${p.category} | [실제가격]: ${p.price} | [매칭된 키워드]: ${p.matchedKeywords.join(", ")}`
            )
            .join("\n")}
        `;

        // 새 공식 @google/genai SDK 콘텐츠 생성 및 JSON 스키마 제어
        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "친한 친구에게 선물을 추천해주는 큐레이터처럼, 광고 톤 없이 자연스럽고 다정한 한국어로 작성해 줘. 존댓말을 사용해 줘. 친근하지만 정중하게.",
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                recommendations: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING", description: "리스트에 전달된 정확한 상품명" },
                      recommendationComment: {
                        type: "STRING",
                        description: "상품 카테고리와 매칭 키워드, 그리고 사용자의 요구사항을 유기적으로 연결한 1~2문장의 자연스러운 추천 추천사",
                      },
                      tags: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                        description: "상품의 특징을 대변하는 해시태그 3개",
                      },
                      imageKeyword: {
                        type: "STRING",
                        enum: [
                          "diffuser", "perfume", "mug", "diary", "mood_light", 
                          "coffee_beans", "wireless_charger", "rug", "drone", 
                          "charger", "speaker", "keyboard", "tumbler", "cookware", 
                          "humidifier", "bag", "vitamins", "pj_set", "plant", 
                          "tea_set", "hand_cream", "bath_bomb", "fountain_pen", 
                          "desk_organizer", "wine_glasses", "candles", 
                          "fitness_tracker", "backpack", "chocolate", "earbuds", 
                          "clock", "monitor", "calendar", "cosmetics", "gift_box"
                        ],
                        description: "이 상품의 핵심 키워드를 가장 잘 나타내는 영어 단어 중 하나를 선택"
                      }
                    },
                    required: ["name", "recommendationComment", "tags", "imageKeyword"],
                  },
                },
              },
              required: ["recommendations"],
            },
          },
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error("Empty response from Gemini API");
        }

        const parsed = JSON.parse(responseText);
        const aiList = parsed.recommendations || [];

        recommendations = top5.map((prod) => {
          // AI 응답 리스트에서 상품명 일치 또는 인덱스에 매칭되는 항목 찾기
          const aiResult = aiList.find(
            (item: any) =>
              item.name === prod.name ||
              (item.name && prod.name.includes(item.name)) ||
              (item.name && item.name.includes(prod.name))
          );

          return {
            id: prod.id.toString(),
            name: prod.name,
            category: prod.category,
            price: `${prod.price.toLocaleString()}원`,
            imageUrl: prod.image_url || undefined,
            imageKeyword: aiResult?.imageKeyword || undefined,
            recommendationComment:
              aiResult?.recommendationComment ||
              `${surveyData.relationship}님을 위한 특별한 ${prod.category} 선물로 아주 잘 어울립니다.`,
            tags: aiResult?.tags || [prod.category, "맞춤선물", "추천"],
          };
        });
      } catch (aiError) {
        console.error("Gemini-3.5-flash batch API generation failed. Falling back to rules:", aiError);
        recommendations = generateFallbackRecommendations(top5, surveyData);
      }
    } else {
      console.log("No Gemini API Key found. Using fallback generator.");
      recommendations = generateFallbackRecommendations(top5, surveyData);
    }

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error("Recommend API Error:", error);
    return NextResponse.json(
      { error: "추천 연산 처리 중 시스템 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// AI 호출 불가 시 룰 기반으로 작동하는 Fallback 생성기
function generateFallbackRecommendations(
  products: Product[],
  survey: SurveyData
): Recommendation[] {
  return products.map((prod) => {
    const matchedHobbies = prod.hobbies.filter((h) => survey.hobbies.includes(h));
    const hobbyText = matchedHobbies.length > 0 ? `${matchedHobbies[0]} 활동` : "다양한 취미 활동";

    // 카테고리별 특성에 맞는 코멘트 템플릿 다채롭게 적용하여 획일화 방지
    let comment = "";
    if (prod.category.includes("뷰티")) {
      comment = `평소 감각적이고 본인을 가꾸는 걸 좋아하시는 ${survey.relationship}님을 위해 준비한 뷰티 아이템입니다. 일상 속에서 편안한 힐링을 선물할 거예요.`;
    } else if (prod.category.includes("디지털/IT") || prod.name.includes("모니터") || prod.name.includes("충전기")) {
      comment = `실용성과 편의성을 중요하게 여기시는 ${survey.relationship}님께 스마트한 일상을 선물할 디지털 기기입니다. 데스크나 라이프스타일에 유용한 아이템이에요.`;
    } else if (prod.category.includes("식품/커피")) {
      comment = `향긋한 여유와 조용한 쉼표를 선사할 맛있는 선물입니다. 바쁜 하루를 보내는 ${survey.relationship}님께 아늑한 티타임을 더해줄 거예요.`;
    } else if (prod.category.includes("리빙/인테리어") || prod.name.includes("시계") || prod.name.includes("러그")) {
      comment = `공간의 분위기를 한층 더 세련되고 포근하게 바꾸어줄 리빙 아이템입니다. ${survey.relationship}님의 아늑한 보금자리에 잘 어울리는 감성 가득한 선물입니다.`;
    } else if (prod.category.includes("문구/데스크테리어")) {
      comment = `정갈한 하루의 계획과 단정한 기록을 돕는 유용한 소품입니다. ${survey.relationship}님의 열정 넘치는 매일을 조용히 응원하는 마음을 담았습니다.`;
    } else {
      comment = `평소 ${hobbyText}를 즐기시는 ${survey.relationship}님을 위해 ${survey.event} 선물로 제안해 드리는 제품입니다. 취향에 부합하는 구성으로 특별한 기억을 선사할 것입니다.`;
    }

    const tags = [prod.category.split("/")[0] || "선물", survey.relationship, survey.event];

    // 상품 카테고리나 이름을 기반으로 영어 키워드 기본 매칭
    const lowercase = prod.name.toLowerCase();
    let keyword = "gift_box";
    if (lowercase.includes("디퓨저") || lowercase.includes("아로마") || lowercase.includes("향수")) keyword = "diffuser";
    else if (lowercase.includes("시계")) keyword = "clock";
    else if (lowercase.includes("모니터")) keyword = "monitor";
    else if (lowercase.includes("달력") || lowercase.includes("캘린더")) keyword = "calendar";
    else if (lowercase.includes("크림") || lowercase.includes("에센스") || lowercase.includes("화장품") || lowercase.includes("세럼") || lowercase.includes("로션") || lowercase.includes("토너")) keyword = "cosmetics";
    else if (lowercase.includes("다이어리") || lowercase.includes("저널") || lowercase.includes("플래너")) keyword = "diary";
    else if (lowercase.includes("무드등") || lowercase.includes("조명") || lowercase.includes("스탠드") || lowercase.includes("캔들")) keyword = "mood_light";
    else if (lowercase.includes("커피") || lowercase.includes("드립백") || lowercase.includes("원두")) keyword = "coffee_beans";
    else if (lowercase.includes("거치대") || lowercase.includes("무선충전")) keyword = "wireless_charger";
    else if (lowercase.includes("러그") || lowercase.includes("매트") || lowercase.includes("카페트") || lowercase.includes("담요")) keyword = "rug";
    else if (lowercase.includes("드론") || lowercase.includes("무선")) keyword = "drone";
    else if (lowercase.includes("멀티탭") || lowercase.includes("충전기") || lowercase.includes("보조배터리")) keyword = "charger";
    else if (lowercase.includes("스피커") || lowercase.includes("헤드폰") || lowercase.includes("블루투스")) keyword = "speaker";
    else if (lowercase.includes("키보드") || lowercase.includes("마우스")) keyword = "keyboard";
    else if (lowercase.includes("텀블러") || lowercase.includes("물병") || lowercase.includes("컵")) keyword = "tumbler";
    else if (lowercase.includes("조리기구") || lowercase.includes("접시") || lowercase.includes("도마")) keyword = "cookware";
    else if (lowercase.includes("가습기") || lowercase.includes("공기청정기")) keyword = "humidifier";
    else if (lowercase.includes("파우치") || lowercase.includes("가방") || lowercase.includes("지갑")) keyword = "bag";
    else if (lowercase.includes("영양제") || lowercase.includes("비타민")) keyword = "vitamins";

    return {
      id: prod.id.toString(),
      name: prod.name,
      category: prod.category,
      price: `${prod.price.toLocaleString()}원`,
      imageUrl: prod.image_url || undefined,
      imageKeyword: keyword,
      recommendationComment: comment,
      tags: tags,
    };
  });
}
