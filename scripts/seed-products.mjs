import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// 1. .env.local에서 환경변수 로드
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 2. CSV 파서 함수 (따옴표 내 쉼표 무시)
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// 3. 쉼표 구분 문자열 -> 배열 변환 헬퍼
function parseArrayField(field) {
  if (!field) return [];
  // 앞뒤 큰따옴표나 공백 제거
  const cleaned = field.replace(/^"|"$/g, "").trim();
  if (!cleaned) return [];
  return cleaned.split(",").map((s) => s.trim()).filter(Boolean);
}

async function run() {
  console.log("=== CSV 데이터 적재 프로세스 시작 ===");
  
  const csvPath = join(process.cwd(), "data", "products_utf8.csv");
  const fileContent = readFileSync(csvPath, "utf-8");
  
  // 라인 분리
  const rawLines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== "");
  const header = parseCSVLine(rawLines[0]);
  const dataRows = rawLines.slice(1);
  
  console.log(`총 데이터 행 수: ${dataRows.length}개`);
  
  const products = [];
  
  for (const rowText of dataRows) {
    const cols = parseCSVLine(rowText);
    if (cols.length < 10) continue; // 정상적이지 않은 데이터 스킵

    // CSV 헤더 기반 인덱스 맵핑
    // 상품명, 카테고리, 가격, 실제가격, 추천 성별, 추천 연령대, 추천 관계, 추천 취미, 추천 성격, 추천 이벤트, 이미지URL, 구매링크
    const name = cols[0];
    const category = cols[1];
    const price_range = cols[2];
    const price = parseInt(cols[3], 10) || 0;
    const gender = cols[4];
    const age_group = cols[5];
    const relationships = parseArrayField(cols[6]);
    const hobbies = parseArrayField(cols[7]);
    const personality = parseArrayField(cols[8]);
    const events = parseArrayField(cols[9]);
    
    // 빈 문자열인 경우 NULL 처리
    const image_url = cols[10] ? cols[10].replace(/^"|"$/g, "").trim() || null : null;
    const purchase_link = cols[11] ? cols[11].replace(/^"|"$/g, "").trim() || null : null;
    
    products.push({
      name,
      category,
      price_range,
      price,
      gender,
      age_group,
      relationships,
      hobbies,
      personality,
      events,
      image_url,
      purchase_link,
    });
  }

  console.log(`파싱 완료된 상품 수: ${products.length}개`);

  // 기존 데이터 초기화 (ID identity 속성 리셋을 권장하지만 여기선 간결하게 전체 삭제 후 재삽입)
  console.log("기존 상품 목록 지우는 중...");
  const { error: deleteError } = await supabase.from("products").delete().neq("id", 0);
  
  if (deleteError) {
    console.error("❌ 기존 데이터 삭제 실패:", deleteError.message);
    process.exit(1);
  }
  
  // 청크(Chunk) 단위 인서트 (Supabase 대량 인서트 제약에 대응하여 50개씩 분할 삽입)
  const chunkSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const { error: insertError } = await supabase.from("products").insert(chunk);
    
    if (insertError) {
      console.error(`❌ 청크 ${i / chunkSize + 1} 적재 실패:`, insertError.message);
      process.exit(1);
    }
    
    insertedCount += chunk.length;
    console.log(`적재 진행률: ${insertedCount} / ${products.length}`);
  }

  console.log("✅ 모든 데이터 적재 완료!");

  // 검증: 전체 카운트 확인
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
    
  if (countError) {
    console.error("❌ 행 수 카운트 조회 실패:", countError.message);
  } else {
    console.log(`📊 DB 내 최종 상품 수: ${count}개`);
  }

  // 검증: 샘플 3개 상세 출력 (배열 변환 확인)
  console.log("\n🔍 데이터 적재 검증용 무작위 샘플 3개:");
  const { data: samples, error: sampleError } = await supabase
    .from("products")
    .select("name, category, relationships, hobbies, personality, events")
    .limit(3);

  if (sampleError) {
    console.error("❌ 샘플 데이터 조회 실패:", sampleError.message);
  } else {
    samples.forEach((sample, idx) => {
      console.log(`\n--- 샘플 #${idx + 1} ---`);
      console.log(`상품명: ${sample.name}`);
      console.log(`카테고리: ${sample.category}`);
      console.log(`추천 관계 (배열):`, sample.relationships);
      console.log(`추천 취미 (배열):`, sample.hobbies);
      console.log(`추천 성격 (배열):`, sample.personality);
      console.log(`추천 이벤트 (배열):`, sample.events);
    });
  }
}

run();
