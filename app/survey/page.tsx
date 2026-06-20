"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";

import { SurveyData } from "@/types/survey";


const INITIAL_STATE: SurveyData = {
  relationship: "",
  gender: "",
  age_group: "",
  budget: "",
  event: "",
  hobbies: [],
  personality: [],
  description: "",
};

const STEPS = [
  {
    key: "relationship",
    title: "받는 사람과의 관계를 선택해 주세요",
    subtitle: "선물하시는 분과 어떤 관계인가요?",
    type: "single",
    options: ["친구", "연인", "썸", "배우자", "부모님", "형제자매", "직장동료", "선생님", "기타"],
  },
  {
    key: "gender",
    title: "받는 사람의 성별을 선택해 주세요",
    subtitle: "성별에 맞춰 적절한 아이템을 제안해 드립니다.",
    type: "single",
    options: ["남성", "여성", "상관없음"],
  },
  {
    key: "age_group",
    title: "받는 사람의 연령대를 선택해 주세요",
    subtitle: "나이대에 딱 어울리는 스타일을 추천해 드릴게요.",
    type: "single",
    options: ["10대", "20대 초반", "20대 후반", "30대", "40대 이상"],
  },
  {
    key: "budget",
    title: "생각하시는 예산 범위를 선택해 주세요",
    subtitle: "가격대별 합리적인 제품군을 분석해 드립니다.",
    type: "single",
    options: ["1만원 이하", "1~3만원", "3~5만원", "5~10만원", "10만원 이상"],
  },
  {
    key: "event",
    title: "어떤 이벤트/계기로 준비하시는 선물인가요?",
    subtitle: "선물하는 순간을 더욱 특별하게 만들 의미를 담아볼게요.",
    type: "single",
    options: [
      "생일",
      "기념일",
      "졸업",
      "입학",
      "취업",
      "승진",
      "집들이",
      "감사선물",
      "크리스마스",
      "발렌타인데이",
      "화이트데이",
      "특별한 이유 없음"
    ],
  },
  {
    key: "hobbies",
    title: "받는 사람의 취미는 무엇인가요?",
    subtitle: "평소에 관심 있어 하거나 자주 즐기는 분야를 선택해 주세요. (최대 3개)",
    type: "multiple",
    options: [
      "독서",
      "게임",
      "운동",
      "커피",
      "영화",
      "음악",
      "여행",
      "패션",
      "뷰티",
      "사진",
      "캠핑",
      "요리"
    ],
  },
  {
    key: "personality",
    title: "받는 사람의 성격이나 라이프스타일은 어떤가요?",
    subtitle: "상대방의 성향에 잘 맞는 톤앤매너를 추천합니다. (최대 3개)",
    type: "multiple",
    options: [
      "실용적",
      "감성적",
      "트렌디함",
      "유머러스",
      "차분함",
      "활동적",
      "모험심 강함",
      "로맨틱",
      "SNS 좋아함",
      "집순이/집돌이"
    ],
  },
  {
    key: "description",
    title: "상대방을 자유롭게 설명해주세요.",
    subtitle: "상대방의 특별한 취향이나 전하고 싶은 메시지가 있다면 자유롭게 적어주세요.",
    type: "textarea",
    placeholder: "예시: 카페 투어를 좋아하고 따뜻한 색감을 좋아함. 최근에 독립을 했음.",
  },
];

export default function SurveyPage() {
  const router = useRouter();
  const { user, isLoading, setIsLoginModalOpen } = useCart();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyData>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  const stepMeta = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  // 1. 초기 마운트 시 저장된 임시 답변 및 단계 로드
  useEffect(() => {
    const savedAnswers = sessionStorage.getItem("giftfinder_temp_answers");
    const savedStep = sessionStorage.getItem("giftfinder_temp_step");

    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error(e);
      }
    }

    if (savedStep) {
      const stepNum = parseInt(savedStep, 10);
      if (!isNaN(stepNum) && stepNum >= 0 && stepNum < totalSteps) {
        setCurrentStep(stepNum);
        window.history.replaceState({ step: stepNum }, "");
      } else {
        window.history.replaceState({ step: 0 }, "");
      }
    } else {
      window.history.replaceState({ step: 0 }, "");
    }
    setIsLoaded(true);
  }, [totalSteps]);

  // 2. 브라우저 뒤로가기/앞으로가기 (popstate) 감지하여 스텝 동기화
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.step === "number") {
        setCurrentStep(event.state.step);
        sessionStorage.setItem("giftfinder_temp_step", String(event.state.step));
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // 3. 답변이나 단계가 바뀔 때마다 sessionStorage에 백업
  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem("giftfinder_temp_answers", JSON.stringify(answers));
    sessionStorage.setItem("giftfinder_temp_step", String(currentStep));
  }, [answers, currentStep, isLoaded]);

  // 단일 선택 핸들러
  const handleSingleSelect = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [stepMeta.key]: val,
    }));
  };

  // 다중 선택 핸들러
  const handleMultipleSelect = (val: string) => {
    const key = stepMeta.key as "hobbies" | "personality";
    const currentList = answers[key] || [];
    const isSelected = currentList.includes(val);

    // 최대 3개 선택 제한 적용
    if (!isSelected && currentList.length >= 3) {
      alert("최대 3개까지만 선택할 수 있습니다.");
      return;
    }

    const newList = isSelected
      ? currentList.filter((item) => item !== val)
      : [...currentList, val];

    setAnswers((prev) => ({
      ...prev,
      [key]: newList,
    }));
  };

  // 텍스트 핸들러
  const handleTextChange = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [stepMeta.key]: val,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      window.history.pushState({ step: nextStep }, "");
      setCurrentStep(nextStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      // 브라우저 history back 호출을 통해 popstate 이벤트 핸들러가 currentStep을 줄이도록 함
      window.history.back();
    }
  };

  const handleSubmit = () => {
    // 최종 결과 sessionStorage 저장
    sessionStorage.setItem("giftfinder_survey", JSON.stringify(answers));
    
    // 임시 백업 세션 스토리지 삭제
    sessionStorage.removeItem("giftfinder_temp_answers");
    sessionStorage.removeItem("giftfinder_temp_step");

    router.push("/result");
  };

  // 현재 단계 유효성 검사 (입력값 선택 여부)
  const isNextDisabled = () => {
    if (stepMeta.type === "single") {
      return !answers[stepMeta.key as keyof SurveyData];
    }
    if (stepMeta.type === "multiple") {
      const list = answers[stepMeta.key as "hobbies" | "personality"] || [];
      return list.length === 0;
    }
    return false;
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
        <Header maxWidthClass="max-w-3xl" />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-md mx-auto animate-fade-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-violet-500/20">
              🎁
            </div>
            <div className="absolute -bottom-1 -right-1 text-2xl animate-bounce">
              ✨
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">로그인 후 선물 추천 받기</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
            AI 맞춤형 선물 추천 서비스는 회원 전용입니다.<br />
            로그인하시면 완벽한 선물 추천부터 장바구니 저장까지 편리하게 이용하실 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full py-4 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            로그인하고 시작하기
          </button>
        </main>
        <footer className="w-full max-w-3xl mx-auto px-4 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
          <p>Designed & Developed by Seonjeong Noh</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
      {/* 상단바 */}
      <Header
        maxWidthClass="max-w-3xl"
        extra={
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
            Q. {currentStep + 1} / {totalSteps}
          </span>
        }
      />

      {/* 메인 설문 영역 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 max-w-2xl w-full mx-auto">
        <div className="w-full">
          {/* 프로그레스 바 */}
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full mb-8 sm:mb-10 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-600 to-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 질문 컨텐츠 영역: key={currentStep}으로 트랜지션 강제 트리거 */}
          <div key={currentStep} className="animate-slide-in">
            {/* 문항 소개 */}
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-2 sm:mb-3">
                {stepMeta.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {stepMeta.subtitle}
              </p>
            </div>

            {/* 선택 요소 그리드 */}
            <div className="min-h-[220px] sm:min-h-[250px] mb-8">
              {stepMeta.type === "single" && (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {stepMeta.options?.map((option) => {
                    const isSelected = answers[stepMeta.key as keyof SurveyData] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSingleSelect(option)}
                        className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold border text-center transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? "bg-violet-600/5 border-violet-600 text-violet-700 shadow-md shadow-violet-500/5 dark:bg-violet-500/10 dark:border-violet-500 dark:text-violet-300"
                            : "bg-white border-slate-200 hover:border-slate-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {stepMeta.type === "multiple" && (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {stepMeta.options?.map((option) => {
                    const key = stepMeta.key as "hobbies" | "personality";
                    const isSelected = answers[key]?.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleMultipleSelect(option)}
                        className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold border text-center transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? "bg-rose-600/5 border-rose-500 text-rose-600 shadow-md shadow-rose-500/5 dark:bg-rose-500/10 dark:border-rose-500 dark:text-rose-300"
                            : "bg-white border-slate-200 hover:border-slate-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {stepMeta.type === "textarea" && (
                <div className="w-full">
                  <textarea
                    className="w-full h-36 sm:h-44 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder-zinc-600 dark:focus:ring-violet-400"
                    placeholder={stepMeta.placeholder}
                    value={answers.description}
                    onChange={(e) => handleTextChange(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 이전 / 다음 / 완료 컨트롤 버튼 */}
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 sm:px-6 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-semibold border flex items-center gap-1 sm:gap-1.5 transition-all ${
                currentStep === 0
                  ? "border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed dark:border-zinc-900 dark:text-zinc-700 dark:bg-zinc-950"
                  : "border-slate-200 bg-white hover:bg-slate-100 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              이전
            </button>

            {currentStep === totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 max-w-[200px] sm:max-w-xs px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5"
              >
                결과 보기
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled()}
                className={`flex-1 max-w-[200px] sm:max-w-xs px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                  isNextDisabled()
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                    : "bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-500/10 cursor-pointer"
                }`}
              >
                다음
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
        <p>Designed & Developed by Seonjeong Noh</p>
      </footer>
    </div>
  );
}
