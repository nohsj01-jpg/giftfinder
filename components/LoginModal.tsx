"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Toast } from "@/context/CartContext";

interface LoginModalProps {
  onClose: () => void;
  showToast: (msg: string, type?: Toast["type"]) => void;
}

export default function LoginModal({ onClose, showToast }: LoginModalProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Google OAuth 로그인 ──────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const nextPath = window.location.pathname + window.location.search;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // 로그인 완료 후 현재 페이지로 돌아오도록 리다이렉트 URL 설정
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          queryParams: {
            // Google 계정 선택 화면 항상 표시
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
      // 리다이렉트가 시작되므로 모달 닫기
      onClose();
    } catch (err: any) {
      console.error("Google login error:", err);
      showToast(err.message || "Google 로그인 중 오류가 발생했습니다.", "error");
      setGoogleLoading(false);
    }
  };

  // ── 체험용 계정 로그인 ────────────────────────────────
  const handleTestLogin = async () => {
    setIsSubmitting(true);
    const testEmail = "guest@giftfinder.ai";
    const testPassword = "password123456";
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        });
        if (signUpError) throw signUpError;
        showToast("신규 체험용 계정이 생성되어 로그인되었습니다.", "success");
      } else {
        showToast("체험용 계정으로 로그인되었습니다.", "success");
      }
      onClose();
    } catch (err: any) {
      console.error("Test login error:", err);
      showToast("테스트 로그인 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* 배경 오버레이 — 클릭해도 닫히지 않음 (모달 외부 영역 차단) */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white/97 dark:bg-zinc-900/97 border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 그라데이션 라인 */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-rose-500 to-amber-400" />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 pt-9">
          {/* 헤더 */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-500 shadow-lg shadow-violet-500/30 mb-4">
              <span className="text-xl">🎁</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              GiftFinder 로그인
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              장바구니와 추천 내역을 저장하려면 로그인하세요.
            </p>
          </div>

          {/* ── Google 로그인 및 체험용 로그인 버튼 ── */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                /* Google 공식 SVG 아이콘 */
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Google로 계속하기
            </button>

            <button
              type="button"
              onClick={handleTestLogin}
              disabled={googleLoading || isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              ⚡ 체험용 가상 계정으로 빠른 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
