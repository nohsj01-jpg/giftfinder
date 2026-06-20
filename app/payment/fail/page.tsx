"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useCart();

  const code = searchParams.get("code") || "UNKNOWN_ERROR";
  const message = searchParams.get("message") || "결제 중 알 수 없는 오류가 발생했습니다.";

  useEffect(() => {
    // 빨간색 토스트 알림 노출
    showToast(`결제에 실패했습니다: ${message}`, "error");

    // 3초 후 /cart 페이지로 자동 이동
    const timer = setTimeout(() => {
      router.replace("/cart");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, showToast, router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      <Header maxWidthClass="max-w-5xl" />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="w-full rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 shadow-2xl relative overflow-hidden text-center">
          {/* 상단 장식 빨간색 경고 선 */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500" />

          <div className="py-6 flex flex-col items-center">
            {/* 경고 아이콘 */}
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 mb-5 shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">
              결제가 취소되었거나 실패했습니다
            </h2>
            
            <div className="w-full p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 text-left text-xs space-y-2 mb-6 mt-3">
              <div className="flex justify-between">
                <span className="text-rose-500/80 dark:text-rose-400">에러 코드</span>
                <span className="font-semibold text-rose-700 dark:text-rose-300">{code}</span>
              </div>
              <div className="flex flex-col gap-1 mt-1 border-t border-rose-100/40 dark:border-rose-900/10 pt-2">
                <span className="text-rose-500/80 dark:text-rose-400">실패 사유</span>
                <span className="font-medium text-slate-700 dark:text-zinc-300 leading-normal break-words">
                  {message}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              장바구니로 돌아갑니다...
            </p>

            <button
              onClick={() => router.replace("/cart")}
              className="w-full py-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>지금 바로 장바구니 가기</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans justify-center items-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}

