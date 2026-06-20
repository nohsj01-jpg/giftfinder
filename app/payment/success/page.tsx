"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, showToast, user } = useCart();
  const supabase = createClient();

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const confirmTriggered = useRef(false);

  useEffect(() => {
    // 쿼리 파라미터가 유효하지 않거나 이미 승인이 완료된 경우 처리 방지
    if (!paymentKey || !orderId || !amount || !user) {
      if (!user) {
        // 로그인 정보가 아직 안불러와졌을 수 있으므로 대기
        return;
      }
      setStatus("error");
      setErrorMsg("결제 승인 파라미터 또는 사용자 로그인 정보가 누락되었습니다.");
      return;
    }

    if (confirmTriggered.current) return;
    confirmTriggered.current = true;

    const confirmPayment = async () => {
      try {
        // 1. Toss Payments 결제 승인 API 호출
        const confirmRes = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        const confirmData = await confirmRes.json();

        if (!confirmRes.ok) {
          throw new Error(confirmData.error || "결제 승인 과정에서 오류가 발생했습니다.");
        }

        // 2. sessionStorage에서 배송 정보 및 카트 아이템 스냅샷 가져오기
        const shippingInfoRaw = sessionStorage.getItem("toss_shipping_info");
        const cartItemsRaw = sessionStorage.getItem("toss_cart_items");

        if (!cartItemsRaw) {
          throw new Error("장바구니 결제 상품 정보가 유실되었습니다.");
        }

        const cartItems = JSON.parse(cartItemsRaw);
        
        // 3. Supabase orders 테이블에 주문 저장
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            total_price: Number(amount),
            status: "completed",
            toss_payment_key: paymentKey,
            toss_order_id: orderId,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 4. order_items 테이블에 스냅샷 저장
        const orderItemsToInsert = cartItems.map((item: any) => {
          const price = item.giftfinder?.실제가격 || 0;
          return {
            order_id: orderData.id,
            product_id: item.product_id,
            product_name: item.giftfinder?.상품명 || item.product_id,
            price: price,
          };
        });

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsToInsert);

        if (itemsError) {
          // 상세 항목 적재 실패 시 상위 주문 취소 처리
          await supabase.from("orders").delete().eq("id", orderData.id);
          throw itemsError;
        }

        // 5. 세션 스토리지 클리어 및 장바구니 비우기
        sessionStorage.removeItem("toss_shipping_info");
        sessionStorage.removeItem("toss_cart_items");
        await clearCart();

        setStatus("success");
        showToast("선물 구매가 완료되었습니다!", "success");

        // 1.5초 뒤 /orders 로 자동 이동
        setTimeout(() => {
          router.push("/orders");
        }, 1500);

      } catch (err: any) {
        console.error("Payment confirmation logic error:", err);
        setStatus("error");
        setErrorMsg(err.message || "결제 처리 중 예상치 못한 에러가 발생했습니다.");
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, user, supabase, clearCart, showToast, router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      <Header maxWidthClass="max-w-5xl" />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="w-full rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 shadow-2xl relative overflow-hidden text-center">
          {/* 상단 장식 그라데이션 선 */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-rose-500 to-amber-400" />

          {status === "loading" && (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                결제 승인 진행 중...
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                안전하게 결제 승인을 진행하고 주문서를 적재하고 있습니다.<br />잠시만 기다려 주세요.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 mb-5 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">
                결제가 성공적으로 완료되었습니다!
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                선물 주문 내역이 안전하게 저장되었습니다.<br />잠시 후 주문 내역 페이지로 자동 이동합니다.
              </p>
              <div className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 text-left text-xs space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">주문 번호</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{orderId?.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">결제 금액</span>
                  <span className="font-extrabold text-violet-600 dark:text-violet-400">
                    {Number(amount).toLocaleString()}원
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push("/orders")}
                className="w-full py-3.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-violet-500/20"
              >
                <span>주문내역 바로 확인하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 mb-5 shadow-lg shadow-rose-500/10">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">
                결제 승인 오류 발생
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed mb-6 max-w-xs break-words">
                {errorMsg}
              </p>
              <button
                onClick={() => router.push("/cart")}
                className="w-full py-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              >
                장바구니로 돌아가기
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans justify-center items-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
