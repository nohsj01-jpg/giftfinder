import Link from "next/link";
import Header from "@/components/Header";

export const metadata = {
  title: "GiftFinder - AI 맞춤형 선물 추천 서비스",
  description: "소중한 사람의 성향, 취미, 이벤트를 분석하여 AI가 가장 완벽한 선물을 찾아드립니다.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
      {/* 배경 장식 (은은한 AI 감성의 Glow 효과) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none select-none">
        <div className="absolute top-[-20%] left-[20%] w-[300px] h-[300px] rounded-full bg-violet-400/20 blur-[100px] dark:bg-violet-600/10" />
        <div className="absolute top-[-10%] right-[20%] w-[350px] h-[350px] rounded-full bg-rose-400/10 blur-[120px] dark:bg-rose-500/5" />
      </div>

      {/* 헤더 네비게이션 */}
      <Header maxWidthClass="max-w-6xl" />

      {/* 메인 히어로 섹션 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto">
        {/* 서비스 홍보 뱃지 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold tracking-wide uppercase mb-6 dark:bg-violet-950/30 dark:border-violet-900/30 dark:text-violet-300">
          <svg
            className="w-3.5 h-3.5 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          고민 없는 완벽한 선택
        </div>

        {/* 메인 카피 */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.15]">
          소중한 사람에게 딱 맞는, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-rose-500 dark:from-violet-400 dark:via-purple-400 dark:to-rose-400">
            AI가 찾아주는 특별한 선물
          </span>
        </h1>

        {/* 한 줄 카피/소개글 */}
        <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          상대방의 성별, 연령대, 성향부터 취미와 이벤트 목적까지 심층 분석하여
          마음을 깊이 전할 수 있는 최고의 선물 리스트를 맞춤 추천해 드립니다.
        </p>

        {/* 선물 추천 시작 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/survey"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white rounded-full bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            선물 추천 받기
            <svg
              className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
        <p>Designed & Developed by Seonjeong Noh</p>
      </footer>
    </div>
  );
}
