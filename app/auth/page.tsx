"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const nextParam = searchParams.get("next") || "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg(err.message || "Google 로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">
        {/* 뒷배경 소프트 데코 그라데이션 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-3xl -z-10 pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl backdrop-blur-md p-8 relative overflow-hidden">
          {/* 상단 그라데이션 테두리 라인 */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-rose-500 to-amber-400" />

          {/* 마스코트 이미지 */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 hover:scale-105 transition-transform duration-300">
              <Image
                src="/Mascot.png"
                alt="GiftFinder Mascot"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* 헤더 안내문구 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              반가워요!
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
              GiftFinder.ai의 AI 기반 맞춤형 선물 추천과<br />
              나만의 선물 장바구니를 시작해 보세요.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-xs text-rose-600 dark:text-rose-400 text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* Google 로그인 버튼 (Google 가이드라인 준수 디자인) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-3.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Google 계정으로 로그인
          </button>

          {/* 하단 꼬리말 */}
          <div className="mt-8 text-center text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed">
            로그인을 진행함으로써 서비스 이용약관 및 개인정보처리방침에<br />동의하는 것으로 간주됩니다.
          </div>
        </div>
      </main>
    </>
  );
}
