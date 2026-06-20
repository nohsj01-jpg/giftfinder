import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local 로드
const envContent = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx > 0) {
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== Supabase giftfinder 데이터 정밀 대조 검사 ===");

  // 1. 전체 데이터에서 무작위 5개 가져와 컬럼명과 내용 확인
  const { data: allRows, error: allErr } = await supabase
    .from("giftfinder")
    .select("*")
    .limit(5);

  if (allErr) {
    console.error("전체 데이터 조회 실패:", allErr.message);
    process.exit(1);
  }

  console.log("\n1. 데이터베이스 실제 값 구조 샘플 (5개):");
  allRows.forEach((row, idx) => {
    console.log(`[로우 #${idx+1}]`);
    console.log(`  - 상품명: ${row.상품명}`);
    console.log(`  - 카테고리: ${row.카테고리}`);
    console.log(`  - 가격: "${row.가격}" (타입: ${typeof row.가격})`);
    console.log(`  - 실제가격: ${row.실제가격}`);
    console.log(`  - 추천 성별: "${row["추천 성별"]}"`);
    console.log(`  - 추천 연령대: "${row["추천 연령대"]}"`);
    console.log(`  - 추천 관계: "${row["추천 관계"]}"`);
    console.log(`  - 추천 이벤트: "${row["추천 이벤트"]}"`);
  });

  // 2. 사용자가 스크린샷에서 선택한 조건으로 실제 필터 대조
  // [친구, 여성, 20대 초반, 3~5만원, 감사선물]
  const targetBudget = "3~5만원";
  const targetGender = "여성";
  const targetAge = "20대 초반";
  const targetRelation = "친구";
  const targetEvent = "감사선물"; // 이전 설문값 '감사/선물' 혹은 '감사선물'

  console.log(`\n2. 테스트 조건 대조 [관계: ${targetRelation}, 성별: ${targetGender}, 연령: ${targetAge}, 예산: ${targetBudget}, 이벤트: ${targetEvent}]`);

  // 단계별 쿼리 시뮬레이션
  
  // (a) 예산 일치 개수
  const { data: step1 } = await supabase.from("giftfinder").select("상품명").eq("가격", targetBudget);
  console.log(`  - 가격이 "${targetBudget}"과 일치하는 상품 수: ${step1?.length || 0}개`);

  // (b) 예산 + 성별 일치 개수
  const { data: step2 } = await supabase.from("giftfinder").select("상품명")
    .eq("가격", targetBudget)
    .in("추천 성별", [targetGender, "상관없음"]);
  console.log(`  - 위 조건 + 성별이 "${targetGender}" 또는 "상관없음"인 상품 수: ${step2?.length || 0}개`);

  // (c) 예산 + 성별 + 연령대 일치 개수
  const { data: step3 } = await supabase.from("giftfinder").select("상품명")
    .eq("가격", targetBudget)
    .in("추천 성별", [targetGender, "상관없음"])
    .eq("추천 연령대", targetAge);
  console.log(`  - 위 조건 + 연령대가 "${targetAge}"인 상품 수: ${step3?.length || 0}개`);

  // (d) 예산 + 성별 + 연령대 + 관계 일치 개수
  const { data: step4 } = await supabase.from("giftfinder").select("상품명")
    .eq("가격", targetBudget)
    .in("추천 성별", [targetGender, "상관없음"])
    .eq("추천 연령대", targetAge)
    .like("추천 관계", `%${targetRelation}%`);
  console.log(`  - 위 조건 + 관계가 "${targetRelation}"을 포함하는 상품 수: ${step4?.length || 0}개`);

  // (e) 예산 + 성별 + 연령대 + 관계 + 이벤트 일치 개수 (최종 엄격 조건)
  const { data: step5 } = await supabase.from("giftfinder").select("상품명")
    .eq("가격", targetBudget)
    .in("추천 성별", [targetGender, "상관없음"])
    .eq("추천 연령대", targetAge)
    .like("추천 관계", `%${targetRelation}%`)
    .or(`"추천 이벤트".ilike.%${targetEvent}%,"추천 이벤트".ilike.%"특별한 이유 없음"%`);
  console.log(`  - 최종 5개 조건 모두 만족하는 상품 수: ${step5?.length || 0}개`);
}

run();
