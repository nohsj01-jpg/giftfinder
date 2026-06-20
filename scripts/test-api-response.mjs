import { readFileSync } from "fs";

async function run() {
  const ports = [3000, 3002, 3001];
  let success = false;
  
  const payload = {
    relationship: "부모님",
    gender: "여성",
    age_group: "40대 이상",
    budget: "1~3만원",
    event: "기념일",
    hobbies: ["독서"],
    personality: ["감성적"],
    description: "테스트"
  };

  console.log("=== /api/recommend API 모의 통신 시작 ===");
  console.log("요청 데이터:", JSON.stringify(payload, null, 2));

  for (const port of ports) {
    const url = `http://localhost:${port}/api/recommend`;
    try {
      console.log(`\n포트 ${port}에 연결 시도 중... (${url})`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      console.log(`HTTP 상태 코드: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      console.log("API 응답 본문:");
      try {
        const parsed = JSON.parse(text);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(text || "(본문 없음)");
      }
      
      if (response.ok) {
        success = true;
        break;
      }
    } catch (err) {
      console.log(`포트 ${port} 연결 실패: ${err.message}`);
    }
  }

  if (!success) {
    console.log("\n❌ 모든 포트의 API 서버 연결에 실패했거나 오류가 발생했습니다.");
  }
}

run();
