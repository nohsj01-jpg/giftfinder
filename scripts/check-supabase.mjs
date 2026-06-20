import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local 파일에서 환경변수 로드
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

console.log("=== Supabase 연결 확인 ===");
console.log(`URL: ${supabaseUrl}`);
console.log();

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 1. 연결 테스트
try {
  const { data, error } = await supabase
    .from("information_schema.tables")
    .select("*")
    .limit(1);

  // information_schema 접근은 RLS로 막힐 수 있으므로, rpc로 조회
} catch (e) {
  // ignore
}

// 2. 테이블 목록 및 상세 정보 조회 (pg_catalog 사용)
try {
  // public 스키마의 테이블 목록
  const { data: tables, error: tablesError } = await supabase.rpc("", {}).throwOnError();
} catch (e) {
  // rpc 없을 수 있음
}

// REST API로 직접 조회
const response = await fetch(`${supabaseUrl}/rest/v1/`, {
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  },
});

if (!response.ok) {
  console.error(`❌ 연결 실패: ${response.status} ${response.statusText}`);
  const text = await response.text();
  console.error(text);
  process.exit(1);
}

console.log("✅ Supabase 연결 성공!\n");

// OpenAPI 스펙에서 테이블 정보 추출
const spec = await response.json();
const definitions = spec.definitions || {};
const paths = spec.paths || {};

// 테이블 목록 추출
const tableNames = Object.keys(definitions).filter(
  (name) => !name.startsWith("_") // 내부 테이블 제외
);

if (tableNames.length === 0) {
  console.log("📋 등록된 테이블이 없습니다 (public 스키마).");
  process.exit(0);
}

console.log(`📋 등록된 테이블: ${tableNames.length}개\n`);

for (const tableName of tableNames) {
  const def = definitions[tableName];
  const props = def.properties || {};
  const required = def.required || [];

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📌 테이블: ${tableName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const columns = Object.entries(props);
  console.log(`   컬럼 수: ${columns.length}`);
  console.log();

  // 컬럼 상세
  for (const [colName, colDef] of columns) {
    const type = colDef.type || colDef.format || "unknown";
    const format = colDef.format && colDef.format !== type ? ` (${colDef.format})` : "";
    const nullable = !required.includes(colName) ? " | nullable" : " | NOT NULL";
    const defaultVal = colDef.default !== undefined ? ` | default: ${colDef.default}` : "";
    const desc = colDef.description ? ` | ${colDef.description}` : "";
    const pk = colDef.description && colDef.description.includes("Primary Key") ? " 🔑" : "";
    const fk = colDef.description && colDef.description.includes("Foreign Key") ? " 🔗" : "";

    console.log(
      `   • ${colName}: ${type}${format}${nullable}${defaultVal}${pk}${fk}${desc}`
    );
  }
  console.log();
}

// 각 테이블의 행 수 조회
console.log(`\n📊 테이블별 행 수:`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

for (const tableName of tableNames) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`   ${tableName}: ❌ 조회 실패 (${error.message})`);
    } else {
      console.log(`   ${tableName}: ${count}행`);
    }
  } catch (e) {
    console.log(`   ${tableName}: ❌ ${e.message}`);
  }
}
