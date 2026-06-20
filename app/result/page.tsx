"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Recommendation, SurveyData } from "@/types/survey";
import { ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";

export default function ResultPage() {
  const router = useRouter();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 로딩 단계 정의 및 설명
  const LOADING_STEPS = [
    { label: "답변 데이터 분석 및 해독", desc: "상대방의 취미, 성격, 추가 요청 및 관계 특성을 정밀 분석합니다.", icon: "📝" },
    { label: "선물 데이터베이스 매칭", desc: "300여 개의 등록된 선물 리스트에서 예산 및 프로필 조건에 맞는 후보군을 선별합니다.", icon: "🔍" },
    { label: "가중치 점수 및 랭킹 정렬", desc: "교집합 관심사 점수(취미 +10점, 성격 +8점)를 합산하여 최종 상위 5대 상품을 결정합니다.", icon: "📊" },
    { label: "Gemini AI 맞춤 코멘트 생성", desc: "Gemini AI가 카테고리와 취향을 매끄럽게 연결한 따뜻한 한글 추천사를 일괄 생성합니다.", icon: "🤖" },
    { label: "최적의 5대 추천 목록 구성 완료", desc: "맞춤형 이미지 매칭 및 해시태그 패키징을 마치고 추천 결과를 출력합니다.", icon: "🎁" }
  ];

  // 로딩 시뮬레이션 및 실제 데이터 완료 조건 바인딩
  useEffect(() => {
    if (!isLoading) return;

    const timer = setInterval(() => {
      setLoadingStep((prev) => {
        // 4단계(인덱스 3)인 Gemini AI 생성 중에 아직 데이터 로드가 안 되었으면 대기
        if (prev === 3 && !isDataLoaded) {
          return prev;
        }
        // 최종 단계 도달 시 타이머를 끄고 0.8초 후 로딩 종료
        if (prev >= 4) {
          clearInterval(timer);
          setTimeout(() => {
            setIsLoading(false);
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1300);

    return () => clearInterval(timer);
  }, [isLoading, isDataLoaded]);

  // 고화질 Unsplash 제품 샷 이미지 사전 정의
  const UNSPLASH_KEYWORD_IMAGES: Record<string, string> = {
    diffuser: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80",
    perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&q=80",
    mug: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80",
    diary: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&q=80",
    mood_light: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80",
    coffee_beans: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&q=80",
    wireless_charger: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=500&q=80",
    rug: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&q=80",
    drone: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&q=80",
    charger: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80",
    speaker: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
    tumbler: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=500&q=80",
    cookware: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&q=80",
    humidifier: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=500&q=80",
    bag: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80",
    vitamins: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80",
    pj_set: "https://images.unsplash.com/photo-1608541737042-87a12275d313?w=500&q=80",
    plant: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=500&q=80",
    tea_set: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80",
    hand_cream: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500&q=80",
    bath_bomb: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80",
    fountain_pen: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&q=80",
    desk_organizer: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&q=80",
    wine_glasses: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=80",
    candles: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
    fitness_tracker: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80",
    backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
    chocolate: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&q=80",
    earbuds: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80",
    clock: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=500&q=80",
    monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80",
    calendar: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&q=80",
    cosmetics: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&q=80",
    gift_box: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80",
    darts: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&q=80",
    printer: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=500&q=80"
  };

  // 상품명과 카테고리에 최적화된 고품질 Unsplash 이미지 매칭 함수
  const getProductImage = (imageKeyword: string | undefined, name: string, category: string): string => {
    // 1. AI(Gemini)가 규정한 이미지 영어 키워드가 존재하고, 그게 'gift_box'가 아닐 때 최우선 매핑
    if (imageKeyword && imageKeyword !== "gift_box" && UNSPLASH_KEYWORD_IMAGES[imageKeyword]) {
      return UNSPLASH_KEYWORD_IMAGES[imageKeyword];
    }

    // 2. 한글 상품명 분석 폴백
    const lowercase = name.toLowerCase();
    
    if (lowercase.includes("디퓨저") || lowercase.includes("아로마") || lowercase.includes("향수")) {
      return UNSPLASH_KEYWORD_IMAGES.diffuser;
    }
    if (lowercase.includes("시계")) {
      return UNSPLASH_KEYWORD_IMAGES.clock;
    }
    if (lowercase.includes("모니터")) {
      return UNSPLASH_KEYWORD_IMAGES.monitor;
    }
    if (lowercase.includes("달력") || lowercase.includes("캘린더")) {
      return UNSPLASH_KEYWORD_IMAGES.calendar;
    }
    if (lowercase.includes("크림") || lowercase.includes("에센스") || lowercase.includes("화장품") || lowercase.includes("세럼") || lowercase.includes("로션") || lowercase.includes("토너")) {
      return UNSPLASH_KEYWORD_IMAGES.cosmetics;
    }
    if (lowercase.includes("다이어리") || lowercase.includes("저널") || lowercase.includes("플래너")) {
      return UNSPLASH_KEYWORD_IMAGES.diary;
    }
    if (lowercase.includes("무드등") || lowercase.includes("조명") || lowercase.includes("스탠드") || lowercase.includes("캔들")) {
      return UNSPLASH_KEYWORD_IMAGES.mood_light;
    }
    if (lowercase.includes("커피") || lowercase.includes("드립백") || lowercase.includes("원두") || lowercase.includes("차세트")) {
      return UNSPLASH_KEYWORD_IMAGES.coffee_beans;
    }
    if (lowercase.includes("거치대") || lowercase.includes("차량용") || lowercase.includes("무선충전")) {
      return UNSPLASH_KEYWORD_IMAGES.wireless_charger;
    }
    if (lowercase.includes("러그") || lowercase.includes("매트") || lowercase.includes("카페트") || lowercase.includes("담요")) {
      return UNSPLASH_KEYWORD_IMAGES.rug;
    }
    if (lowercase.includes("드론") || lowercase.includes("헬기") || lowercase.includes("무선")) {
      return UNSPLASH_KEYWORD_IMAGES.drone;
    }
    if (lowercase.includes("멀티탭") || lowercase.includes("충전기") || lowercase.includes("보조배터리")) {
      return UNSPLASH_KEYWORD_IMAGES.charger;
    }
    if (lowercase.includes("스피커") || lowercase.includes("음악") || lowercase.includes("헤드폰") || lowercase.includes("블루투스")) {
      return UNSPLASH_KEYWORD_IMAGES.speaker;
    }
    if (lowercase.includes("키보드") || lowercase.includes("마우스") || lowercase.includes("데스크")) {
      return UNSPLASH_KEYWORD_IMAGES.keyboard;
    }
    if (lowercase.includes("텀블러") || lowercase.includes("물병") || lowercase.includes("컵")) {
      return UNSPLASH_KEYWORD_IMAGES.tumbler;
    }
    if (lowercase.includes("조리기구") || lowercase.includes("접시") || lowercase.includes("도마") || lowercase.includes("식기")) {
      return UNSPLASH_KEYWORD_IMAGES.cookware;
    }
    if (lowercase.includes("가습기") || lowercase.includes("공기청정기")) {
      return UNSPLASH_KEYWORD_IMAGES.humidifier;
    }
    if (lowercase.includes("파우치") || lowercase.includes("가방") || lowercase.includes("지갑")) {
      return UNSPLASH_KEYWORD_IMAGES.bag;
    }
    if (lowercase.includes("영양제") || lowercase.includes("멀티비타민") || lowercase.includes("유산균")) {
      return UNSPLASH_KEYWORD_IMAGES.vitamins;
    }
    if (lowercase.includes("정리함") || lowercase.includes("오거나이저")) {
      return UNSPLASH_KEYWORD_IMAGES.desk_organizer;
    }
    if (lowercase.includes("프린터") || lowercase.includes("포토프린터")) {
      return UNSPLASH_KEYWORD_IMAGES.printer;
    }
    if (lowercase.includes("다트") || lowercase.includes("다트보드") || lowercase.includes("보드게임")) {
      return UNSPLASH_KEYWORD_IMAGES.darts;
    }

    // 카테고리별 기본 웰페이퍼 폴백
    switch (category) {
      case "디지털/IT":
        return "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80";
      case "문구/데스크테리어":
        return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80";
      case "취미/레저":
        return "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&q=80";
      case "뷰티":
        return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80";
      case "식품/커피":
        return "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80";
      case "패션잡화":
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80";
      case "리빙/인테리어":
        return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80";
      default:
        return UNSPLASH_KEYWORD_IMAGES.gift_box;
    }
  };

  useEffect(() => {
    // SessionStorage에서 데이터 읽기
    const rawData = sessionStorage.getItem("giftfinder_survey");
    if (!rawData) {
      setError("설문 조사 데이터가 존재하지 않습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const parsedData = JSON.parse(rawData) as SurveyData;
      setSurveyData(parsedData);

      const adminWeightsRaw = localStorage.getItem("admin_recommend_weights");
      const weights = adminWeightsRaw ? JSON.parse(adminWeightsRaw) : undefined;
      const requestBody = { ...parsedData, weights };

      // 실제 API 호출로 추천 데이터 가져오기
      fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
        .then((res) => {
          if (!res.ok) throw new Error("API 응답이 올바르지 않습니다.");
          return res.json();
        })
        .then((res: Recommendation[]) => {
          setRecommendations(res);
          setIsDataLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          setError("추천 결과를 가져오는 중 오류가 발생했습니다.");
          setIsLoading(false);
        });
    } catch (e) {
      setError("잘못된 데이터 형식입니다.");
      setIsLoading(false);
    }
  }, []);

  // 카테고리별로 알맞은 파스텔 그라데이션 및 이니셜 아이콘 제공
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "뷰티/바디케어":
        return {
          bg: "from-pink-100 to-rose-200 dark:from-rose-950/40 dark:to-pink-900/20",
          text: "text-rose-600 dark:text-rose-400",
          icon: "🧴",
        };
      case "식품/리빙":
        return {
          bg: "from-amber-100 to-orange-200 dark:from-amber-950/40 dark:to-orange-900/20",
          text: "text-amber-600 dark:text-amber-400",
          icon: "☕",
        };
      case "IT/테크":
        return {
          bg: "from-cyan-100 to-blue-200 dark:from-cyan-950/40 dark:to-blue-900/20",
          text: "text-cyan-600 dark:text-cyan-400",
          icon: "🔌",
        };
      case "문구/오피스":
        return {
          bg: "from-violet-100 to-purple-200 dark:from-violet-950/40 dark:to-purple-900/20",
          text: "text-violet-600 dark:text-violet-400",
          icon: "✍️",
        };
      case "리빙/반려식물":
        return {
          bg: "from-emerald-100 to-teal-200 dark:from-emerald-950/40 dark:to-teal-900/20",
          text: "text-emerald-600 dark:text-emerald-400",
          icon: "🌿",
        };
      default:
        return {
          bg: "from-slate-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800",
          text: "text-slate-600 dark:text-zinc-400",
          icon: "🎁",
        };
    }
  };

  // 에러 발생 혹은 데이터 누락 시 화면
  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
        <Header maxWidthClass="max-w-4xl" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-6 dark:bg-rose-950/20 dark:border-rose-900/30">
            <span className="text-2xl text-rose-500">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-3">설문 정보가 확인되지 않습니다</h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8 max-w-sm">
            원활한 AI 선물 분석을 위해 처음부터 다시 설문지를 작성해 주세요.
          </p>
          <Link
            href="/survey"
            className="px-6 py-3 rounded-full text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-500/10 transition-all"
          >
            설문 조사 다시 시작하기
          </Link>
        </main>
        <footer className="w-full max-w-4xl mx-auto px-6 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
          <p>Designed & Developed by Seonjeong Noh</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
      {/* 상단바 */}
      <Header
        maxWidthClass="max-w-4xl"
        extra={
          <Link
            href="/survey"
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            다시 분석하기
          </Link>
        }
      />

      {/* 메인 결과 영역 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {/* 상단 요약 타이틀 */}
        {surveyData && (
          <div className="mb-10 text-center sm:text-left">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
              <span className="px-2.5 py-1 rounded bg-slate-200/60 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {surveyData.relationship}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-200/60 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {surveyData.gender}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-200/60 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {surveyData.age_group}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-200/60 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {surveyData.budget}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-200/60 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {surveyData.event}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              AI 추천 선물 리스트
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              작성해주신 설문 답변을 바탕으로 AI가 선정한 5가지 추천 목록입니다.
            </p>
          </div>
        )}

        {/* 1. 로딩 상태 (스켈레톤 UI + Glassmorphic AI 분석 알림창) */}
        {isLoading ? (
          <div className="relative">
            {/* 1-1. 화면 중앙 Glassmorphism AI 분석 알림 모달 */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 dark:bg-zinc-950/50 backdrop-blur-xs transition-opacity duration-300">
              <div className="relative w-full max-w-md p-7 md:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 transform scale-100">
                {/* 상단 펄스 그라데이션 장식 라인 */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 animate-pulse" />
                
                {/* 헤더 */}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/30 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 animate-bounce">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400 animate-ping" />
                    AI 큐레이터 매칭 중
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">
                    선물 분석 및 취향 큐레이션
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    질문 답변을 토대로 최적의 상품 5가지를 매칭하고 있습니다.
                  </p>
                </div>

                {/* 단계 리스트 */}
                <div className="space-y-4 my-2">
                  {LOADING_STEPS.map((step, idx) => {
                    const isCompleted = idx < loadingStep;
                    const isActive = idx === loadingStep;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-3.5 transition-all duration-300 ${
                          isCompleted ? "opacity-100 text-slate-700 dark:text-zinc-300" :
                          isActive ? "opacity-100 text-violet-600 dark:text-violet-400 font-medium" : 
                          "opacity-35 text-slate-400 dark:text-zinc-600"
                        }`}
                      >
                        {/* 상태 아이콘 */}
                        <div className="flex items-center justify-center shrink-0 mt-0.5">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md shadow-emerald-500/10">
                              ✓
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 rounded-full border-2 border-violet-600 border-t-transparent animate-spin dark:border-violet-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-zinc-800 flex items-center justify-center text-[9px]">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        {/* 텍스트 설명 */}
                        <div>
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <span>{step.icon}</span>
                            <span>{step.label}</span>
                          </div>
                          {isActive && (
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                              {step.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 하단 진행률 인디케이터 */}
                <div className="mt-7 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5">
                    <span>전체 연산 진행률</span>
                    <span className="text-violet-600 dark:text-violet-400">{Math.min(loadingStep * 25, 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-600 to-rose-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(loadingStep * 25, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 1-2. 배경으로 보이는 흐릿한 스켈레톤 리스트 */}
            <div className="space-y-6 blur-xs pointer-events-none opacity-40">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-6 p-6 rounded-3xl bg-white border border-slate-100 dark:bg-zinc-900 dark:border-zinc-900/50 animate-pulse"
                >
                  <div className="w-full sm:w-32 h-32 rounded-2xl bg-slate-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-4 py-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-24" />
                        <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-full w-2/3" />
                      </div>
                      <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-full w-16" />
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-full" />
                    <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 2. 본 목록 출력 */
          <div className="space-y-6 animate-fade-in">
            {recommendations.map((rec) => {
              const theme = getCategoryTheme(rec.category);
              const imageUrl = getProductImage(rec.imageKeyword, rec.name, rec.category);
              return (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 dark:bg-zinc-900 dark:border-zinc-900/50 dark:hover:border-zinc-800/80 transition-all duration-300"
                >
                  {/* 카테고리 테마 기반 이미지 플레이스홀더 (Unsplash 사진 탑재) */}
                  <div className="relative w-full sm:w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 shadow-inner flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={rec.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-white/80 backdrop-blur-xs text-[10px] font-bold shadow-xs text-slate-800 dark:bg-zinc-950/80 dark:text-zinc-200">
                      {theme.icon}
                    </div>
                  </div>


                  {/* 상품 콘텐츠 */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* 카테고리 & 가격 */}
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold tracking-wider uppercase ${theme.text}`}>
                          {rec.category}
                        </span>
                        <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                          {rec.price}
                        </span>
                      </div>

                      {/* 상품명 */}
                      <h3 className="text-lg font-bold tracking-tight mb-3 text-slate-900 dark:text-zinc-50">
                        {rec.name}
                      </h3>

                      {/* AI 코멘트 */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/40">
                        <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-light whitespace-pre-line">
                          <span className="font-semibold text-violet-600 dark:text-violet-400 mr-1.5">
                            AI 코멘트
                          </span>
                          {rec.recommendationComment}
                        </p>
                      </div>
                    </div>

                    {/* 태그 및 장바구니 버튼 행 */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {rec.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xxs font-medium dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* 장바구니 담기 / 취소 버튼 */}
                      {isInCart(rec.name) ? (
                        <button
                          onClick={() => removeFromCart(rec.name)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/40 dark:hover:bg-violet-950/70 transition-all duration-200 shrink-0"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          담기 취소
                        </button>
                      ) : (
                        <button
                          onClick={() => addToCart(rec)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all duration-200 active:scale-95 shrink-0"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          장바구니 담기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 추천 다시 시작 CTA */}
            <div className="pt-8 text-center">
              <Link
                href="/survey"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/10 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all duration-200"
              >
                다른 선물도 추천받기
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
        <p>Designed & Developed by Seonjeong Noh</p>
      </footer>
    </div>
  );
}
