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

    // [1단계 쿼리] 사용자가 선택한 예산(budget) 및 이벤트(event) 필터를 적용하여 조회
    console.log("🔍 [1단계] 예산 및 이벤트 필터 검색 시작...");
    let { data: rawRows, error: dbError } = await supabase
      .from("giftfinder")
      .select("*")
      .eq("가격", surveyData.budget)
      .or(`"추천 이벤트".ilike.%${surveyData.event}%,"추천 이벤트".ilike.%"특별한 이유 없음"%`);

    if (dbError) {
      console.error("❌ Supabase 1단계 Query Error:", dbError.message);
    }

    let products: Product[] = [];
    if (rawRows && rawRows.length > 0) {
      products = rawRows.map(mapDbToProduct);
      console.log(`✅ [1단계 성공] ${products.length}개 매칭 완료.`);
    }

    // [2단계 쿼리] 결과가 부족한 경우 이벤트 조건 없이 예산(budget)만으로 필터링하여 풀 확대
    if (products.length < 10) {
      console.log("⚠️ 1단계 조회 상품 수가 부족하여 2단계 예산 필터 단독 검색을 시도합니다...");
      try {
        const { data: looseRows } = await supabase
          .from("giftfinder")
          .select("*")
          .eq("가격", surveyData.budget);
        
        if (looseRows && looseRows.length > 0) {
          const looseProducts = looseRows.map(mapDbToProduct);
          const existingNames = new Set(products.map(p => p.name));
          looseProducts.forEach(lp => {
            if (!existingNames.has(lp.name)) {
              products.push(lp);
            }
          });
        }
      } catch (e) {
        console.error("❌ 2단계 검색 예외:", e);
      }
    }

    // [3단계 쿼리] 여전히 부족할 경우 전체 DB 상품 병합
    if (products.length < 10) {
      console.log("⚠️ 상품 수가 부족하여 전체 상품을 로드하여 병합합니다...");
      try {
        const { data: fallbackRows } = await supabase
          .from("giftfinder")
          .select("*")
          .limit(50);
        if (fallbackRows) {
          const fallbackProducts = fallbackRows.map(mapDbToProduct);
          const existingNames = new Set(products.map(p => p.name));
          fallbackProducts.forEach(fp => {
            if (!existingNames.has(fp.name)) {
              products.push(fp);
            }
          });
        }
      } catch (e) {
        console.error("❌ 3단계 백업 검색 예외:", e);
      }
    }

    // 2. 가중치 기반 스코어 매칭 및 동점 처리 랭킹 정렬 실행 (관리자 탭 설정 가중치 반영)
    const ranked = rankProducts(products, surveyData);
    const top10 = ranked.slice(0, 10);

    // 3. AI 기반 추천사(멘트) 생성 프로세스
    const aiClient = getGoogleGenAIClient();
    let recommendations: Recommendation[] = [];

    if (aiClient) {
      try {
        const prompt = `
          이제 사용자의 설문 데이터와 Supabase의 상품 데이터를 연결해서 Gemini AI 분석을 실행할 거야.
          아래 [추천 후보 상품군] 중 사용자의 성향(취미, 성격, 자유 설명 등)에 가장 부합하는 3가지 선물을 선정해서 JSON 형식으로 출력해 줘.

          [사용자 설문 정보]
          - 관계: ${surveyData.relationship}
          - 성별: ${surveyData.gender}
          - 나이: ${surveyData.age_group}
          - 예산: ${surveyData.budget}
          - 이벤트: ${surveyData.event}
          - 취미: ${surveyData.hobbies.join(", ") || "없음"}
          - 성격: ${surveyData.personality.join(", ") || "없음"}
          - 자유 설명: ${surveyData.description || "없음"}

          [추천 후보 상품군 (최대 10개)]
          ${top10
            .map(
              (p, i) =>
                `${i + 1}. [상품명]: ${p.name} | [카테고리]: ${p.category} | [실제가격]: ${p.price.toLocaleString()}원 | [취미태그]: ${p.hobbies.join(", ")} | [성격태그]: ${p.personality.join(", ")}`
            )
            .join("\n")}
        `;

        const response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: `
              너는 10년 차 베테랑 선물 큐레이터이자 심리 분석가야. 사용자의 설문 데이터를 분석하여 가장 감동적인 선물을 추천하고, 그 이유를 논리적이고 감성적으로 설명해야 해.

              Task:
              1. 매칭 분석: 사용자가 입력한 '성격'과 '취미', '자유 설명'의 뉘앙스를 파악해 후보 상품 중 가장 적합한 3가지를 선정해.
              2. 감성 멘트 작성 (ai_comment): 단순히 상품 정보만 나열하지 마. "카페를 좋아하고 감성이 풍부한 친구"라면, "지친 일상에 카페 같은 휴식을 선물해 보세요"와 같이 사용자의 상황에 완전히 몰입한 멘트를 정중하고 따뜻한 존댓말의 한국어로 작성해.
              3. 데이터 기반 근거 (match_reason): 왜 이 상품을 추천했는지 설문 답변의 키워드(취미, 성격 등)를 1개 이상 반드시 인용하여 근거를 제시해.
            `,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                recommendations: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      product_name: { type: "STRING", description: "후보 상품군 리스트에 전달된 정확한 상품명" },
                      category: { type: "STRING", description: "상품의 카테고리" },
                      price: { type: "STRING", description: "상품의 가격 (예: 25,000원)" },
                      ai_comment: { type: "STRING", description: "사용자를 위한 감성적이고 따뜻한 추천 멘트" },
                      match_reason: { type: "STRING", description: "취미, 성격 등 구체적 키워드를 1개 이상 인용한 추천 근거" }
                    },
                    required: ["product_name", "category", "price", "ai_comment", "match_reason"],
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

        recommendations = aiList.map((item: any) => {
          const originalProd = top10.find(
            (p) =>
              p.name === item.product_name ||
              p.name.includes(item.product_name) ||
              item.product_name.includes(p.name)
          );

          const lowercaseName = (originalProd?.name || item.product_name).toLowerCase();
          let keyword = "gift_box";
          if (lowercaseName.includes("디퓨저") || lowercaseName.includes("아로마") || lowercaseName.includes("향수")) keyword = "diffuser";
          else if (lowercaseName.includes("시계")) keyword = "clock";
          else if (lowercaseName.includes("모니터")) keyword = "monitor";
          else if (lowercaseName.includes("달력") || lowercaseName.includes("캘린더")) keyword = "calendar";
          else if (lowercaseName.includes("크림") || lowercaseName.includes("에센스") || lowercaseName.includes("화장품") || lowercaseName.includes("세럼") || lowercaseName.includes("로션") || lowercaseName.includes("토너")) keyword = "cosmetics";
          else if (lowercaseName.includes("다이어리") || lowercaseName.includes("저널") || lowercaseName.includes("플래너")) keyword = "diary";
          else if (lowercaseName.includes("무드등") || lowercaseName.includes("조명") || lowercaseName.includes("스탠드") || lowercaseName.includes("캔들")) keyword = "mood_light";
          else if (lowercaseName.includes("커피") || lowercaseName.includes("드립백") || lowercaseName.includes("원두")) keyword = "coffee_beans";
          else if (lowercaseName.includes("거치대") || lowercaseName.includes("무선충전")) keyword = "wireless_charger";
          else if (lowercaseName.includes("러그") || lowercaseName.includes("매트") || lowercaseName.includes("카페트") || lowercaseName.includes("담요")) keyword = "rug";
          else if (lowercaseName.includes("드론") || lowercaseName.includes("무선")) keyword = "drone";
          else if (lowercaseName.includes("멀티탭") || lowercaseName.includes("충전기") || lowercaseName.includes("보조배터리")) keyword = "charger";
          else if (lowercaseName.includes("스피커") || lowercaseName.includes("헤드폰") || lowercaseName.includes("블루투스")) keyword = "speaker";
          else if (lowercaseName.includes("키보드") || lowercaseName.includes("마우스")) keyword = "keyboard";
          else if (lowercaseName.includes("텀블러") || lowercaseName.includes("물병") || lowercaseName.includes("컵")) keyword = "tumbler";
          else if (lowercaseName.includes("조리기구") || lowercaseName.includes("접시") || lowercaseName.includes("도마")) keyword = "cookware";
          else if (lowercaseName.includes("가습기") || lowercaseName.includes("공기청정기")) keyword = "humidifier";
          else if (lowercaseName.includes("파우치") || lowercaseName.includes("가방") || lowercaseName.includes("지갑")) keyword = "bag";
          else if (lowercaseName.includes("영양제") || lowercaseName.includes("비타민")) keyword = "vitamins";
          else if (lowercaseName.includes("정리함") || lowercaseName.includes("오거나이저")) keyword = "desk_organizer";
          else if (lowercaseName.includes("프린터") || lowercaseName.includes("포토프린터")) keyword = "printer";
          else if (lowercaseName.includes("다트") || lowercaseName.includes("다트보드") || lowercaseName.includes("보드게임")) keyword = "darts";

          const tags = [
            originalProd ? originalProd.category.split("/")[0] : item.category.split("/")[0],
            surveyData.relationship,
            surveyData.event,
          ];

          return {
            id: originalProd ? originalProd.id.toString() : item.product_name,
            name: originalProd ? originalProd.name : item.product_name,
            category: originalProd ? originalProd.category : item.category,
            price: originalProd ? `${originalProd.price.toLocaleString()}원` : item.price,
            imageUrl: originalProd?.image_url || undefined,
            imageKeyword: keyword,
            recommendationComment: `${item.ai_comment}\n\n💡 추천 근거: ${item.match_reason}`,
            tags: tags,
          };
        });
      } catch (aiError) {
        console.error("Gemini batch API generation failed. Falling back to rules:", aiError);
        const top3 = top10.slice(0, 3);
        recommendations = generateFallbackRecommendations(top3, surveyData);
      }
    } else {
      console.log("No Gemini API Key found. Using fallback generator.");
      const top3 = top10.slice(0, 3);
      recommendations = generateFallbackRecommendations(top3, surveyData);
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
