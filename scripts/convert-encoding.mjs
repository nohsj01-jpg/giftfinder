import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const inputPath = "c:\\Users\\노혜정\\Downloads\\product_recommendation_db_v2.csv";
const outputPath = "c:\\Users\\노혜정\\Downloads\\giftfinder\\data\\products_utf8.csv";

try {
  // data 폴더 생성
  mkdirSync(dirname(outputPath), { recursive: true });

  // euc-kr 디코딩을 위해 파일 버퍼로 읽기
  const buffer = readFileSync(inputPath);
  const decoder = new TextDecoder("euc-kr");
  const text = decoder.decode(buffer);

  // 헤더 및 첫 줄 샘플 출력
  const lines = text.split("\n");
  console.log("=== Node.js 디코딩 성공 ===");
  console.log("Header sample:", lines[0]);
  console.log("First row sample:", lines[1]);

  // UTF-8로 저장
  writeFileSync(outputPath, text, "utf-8");
  console.log(`Saved UTF-8 file to: ${outputPath}`);
} catch (e) {
  console.error("Failed to decode or write file:", e);
}
