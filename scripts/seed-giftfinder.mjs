import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load env
const envContent = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx > 0) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// CSV parser
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function cleanField(f) {
  return (f || "").replace(/^"|"$/g, "").trim();
}

async function run() {
  console.log("=== giftfinder 전체 데이터 재업로드 시작 ===");

  // 2. Parse CSV
  const csvPath = join(process.cwd(), "data", "products_utf8.csv");
  const fileContent = readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, "");
  const rawLines = fileContent.split(/\r?\n/).filter(l => l.trim() !== "");
  const dataRows = rawLines.slice(1);

  console.log(`CSV 파싱 중... (${dataRows.length}행)`);

  const products = [];
  for (const rowText of dataRows) {
    const cols = parseCSVLine(rowText);
    if (cols.length < 10) continue;

    products.push({
      "상품명": cleanField(cols[0]),
      "카테고리": cleanField(cols[1]),
      "가격": cleanField(cols[2]),       // 가격범위 (텍스트)
      "실제가격": parseInt(cols[3], 10) || 0,
      "추천 성별": cleanField(cols[4]),
      "추천 연령대": cleanField(cols[5]),
      "추천 관계": cleanField(cols[6]),
      "추천 취미": cleanField(cols[7]),
      "추천 성격": cleanField(cols[8]),
      "추천 이벤트": cleanField(cols[9]),
      "이미지URL": cleanField(cols[10]) || null,
      "구매링크": cleanField(cols[11]) || null,
    });
  }

  console.log(`파싱 완료: ${products.length}개`);
  console.log("샘플:", JSON.stringify(products[0], null, 2));

  // 3. Delete existing
  console.log("3. 기존 데이터 삭제 중...");
  const { error: delErr } = await supabase
    .from("giftfinder")
    .delete()
    .gte("실제가격", 0);

  if (delErr) {
    // Try alternate delete
    await supabase.from("giftfinder").delete().neq("상품명", "");
  }

  // 4. Insert in chunks of 50
  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const { error: insertErr } = await supabase.from("giftfinder").insert(chunk);
    if (insertErr) {
      console.error(`청크 ${Math.floor(i/chunkSize)+1} 실패:`, insertErr.message);
      console.error("첫 항목:", JSON.stringify(chunk[0]));
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`적재: ${inserted}/${products.length}`);
  }

  // 5. Verify
  const { count } = await supabase
    .from("giftfinder")
    .select("*", { count: "exact", head: true });
  console.log(`\n✅ 완료! DB 내 상품 수: ${count}개`);

  // 6. 체험용 가상 계정 생성 및 인증 상태 동기화
  console.log("\n6. 체험용 계정 상태 확인 및 생성 중...");
  const testEmail = "guest@giftfinder.ai";
  const testPassword = "password123456";
  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const guestUser = users.find(u => u.email === testEmail);
    if (!guestUser) {
      console.log("체험용 계정이 없습니다. 생성 중...");
      const { error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      if (createError) throw createError;
      console.log("✅ 체험용 계정 생성 및 자동 인증 완료!");
    } else {
      console.log("체험용 계정이 이미 존재합니다. 인증 상태 및 패스워드 재설정 중...");
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        guestUser.id,
        { 
          email_confirm: true,
          password: testPassword
        }
      );
      if (updateError) throw updateError;
      console.log("✅ 체험용 계정 인증 및 패스워드 동기화 완료!");
    }
  } catch (err) {
    console.error("⚠️ 체험용 계정 설정 중 오류 발생:", err.message);
  }

  // 7. Test anon access
  const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: anonData, error: anonErr } = await anonClient.from("giftfinder").select("상품명").limit(3);
  console.log(`\nanon 조회 테스트: ${anonData?.length || 0}개 반환, 오류: ${anonErr?.message || "없음"}`);
  if (anonData && anonData.length > 0) {
    console.log("✅ anon 조회 성공!");
  } else {
    console.log("⚠️ anon 조회 실패 - RLS 정책 확인 필요");
  }
}

run().catch(err => { console.error(err); process.exit(1); });
