"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, X, Gift, ArrowRight, Trash2 } from "lucide-react";
import { useCart, CartItem } from "@/context/CartContext";
import Header from "@/components/Header";

// 카테고리별 이미지 폴백 (result 페이지와 동일한 로직)
const CATEGORY_IMAGES: Record<string, string> = {
  "디지털/IT": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80",
  "문구/데스크테리어": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
  "취미/레저": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
  "뷰티": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
  "식품/커피": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  "패션잡화": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  "리빙/인테리어": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80";

function getProductImage(item: CartItem): string {
  const category = item.giftfinder?.카테고리 ?? "";
  const name = (item.giftfinder?.상품명 ?? item.product_id).toLowerCase();

  // 상품명 키워드 매칭
  if (name.includes("디퓨저") || name.includes("아로마") || name.includes("향수"))
    return "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80";
  if (name.includes("시계"))
    return "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=400&q=80";
  if (name.includes("모니터"))
    return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80";
  if (name.includes("커피") || name.includes("원두") || name.includes("드립백"))
    return "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400&q=80";
  if (name.includes("텀블러") || name.includes("컵") || name.includes("물병"))
    return "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400&q=80";
  if (name.includes("다이어리") || name.includes("플래너") || name.includes("저널"))
    return "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80";
  if (name.includes("무드등") || name.includes("조명") || name.includes("캔들"))
    return "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80";
  if (name.includes("스피커") || name.includes("이어폰") || name.includes("헤드폰"))
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80";
  if (name.includes("키보드") || name.includes("마우스"))
    return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80";
  if (name.includes("파우치") || name.includes("가방") || name.includes("지갑"))
    return "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80";
  if (name.includes("충전기") || name.includes("무선충전") || name.includes("보조배터리"))
    return "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80";
  if (name.includes("정리함") || name.includes("오거나이저"))
    return "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&q=80";
  if (name.includes("프린터") || name.includes("포토프린터"))
    return "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&q=80";
  if (name.includes("다트") || name.includes("다트보드") || name.includes("보드게임"))
    return "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80";

  return CATEGORY_IMAGES[category] ?? FALLBACK_IMAGE;
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case "디지털/IT": return "🔌";
    case "문구/데스크테리어": return "✍️";
    case "취미/레저": return "🎯";
    case "뷰티": return "🧴";
    case "식품/커피": return "☕";
    case "패션잡화": return "👜";
    case "리빙/인테리어": return "🏠";
    default: return "🎁";
  }
}

// ─── 스켈레톤 로딩 카드 ──────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-16" />
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-2/3" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-20" />
      </div>
    </div>
  );
}

// ─── 빈 장바구니 상태 ──────────────────────────────────
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* 일러스트 아이콘 */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center border border-violet-100 dark:border-violet-900/30">
          <ShoppingCart className="w-10 h-10 text-violet-300 dark:text-violet-700" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-2xl">🎁</span>
      </div>

      <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2 tracking-tight">
        아직 담긴 선물이 없습니다
      </h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-xs">
        AI 추천을 통해 마음에 드는 선물을 찾아<br />장바구니에 담아보세요!
      </p>

      <Link
        href="/survey"
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 shadow-lg shadow-violet-600/20 transition-all duration-300 hover:-translate-y-0.5"
      >
        <Gift className="w-4 h-4" />
        선물 추천 받기
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ─── 메인 장바구니 페이지 ──────────────────────────────────
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ShippingModal, { ShippingInfo } from "@/components/ShippingModal";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, cartCount, totalPrice, isLoading, user, removeFromCart, clearCart, showToast } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const supabase = createClient();

  // 비로그인 상태 → 홈으로 리다이렉트 (auth 로드 완료 후에만 판정)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  // 결제하기(주문하기) 처리 흐름 - 토스페이먼츠 결제창 호출
  const handleCheckout = async (info: ShippingInfo) => {
    if (!user || cartItems.length === 0) return;
    setIsShippingModalOpen(false);
    setCheckoutLoading(true);

    try {
      const clientKey = (process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_kYG57Eba3GPdyxvPeY69VpWDOxmA").trim();
      
      // 토스페이먼츠 SDK 로드
      const sdk = await loadTossPayments(clientKey);

      // 개별 결제창(payment) 인스턴스 생성 (customerKey 설정 필수) - API 개별 연동 키 전용
      const tossPayment = sdk.payment({
        customerKey: user.id,
      });

      // 결제창 호출용 주문서 고유 식별값 및 기본 데이터 설정
      const orderId = "GIFT-" + Date.now();
      const orderName = "AI 추천 선물 구매";
      
      // 임시로 수령인 정보 및 임시 주문 상태 저장용 sessionStorage 작성 (Success 페이지에서 Supabase 적재 처리 예정)
      sessionStorage.setItem("toss_shipping_info", JSON.stringify(info));
      sessionStorage.setItem("toss_cart_items", JSON.stringify(cartItems));

      // 개별 결제창 방식(requestPayment) 호출
      await tossPayment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: totalPrice,
        },
        orderId: orderId,
        orderName: orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user.email,
        customerName: user.user_metadata?.name || user.user_metadata?.full_name || "구매자",
      });

    } catch (err: any) {
      console.error("Toss Payments checkout screen call error:", err);
      showToast(err.message || "결제창 호출 중 오류가 발생했습니다.", "error");
      setCheckoutLoading(false);
    }
  };

  // auth 로딩 중 or 비로그인 → 빈 화면 (리다이렉트 직전)
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      <Header maxWidthClass="max-w-5xl" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            장바구니
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {cartCount > 0
              ? `총 ${cartCount}개의 선물이 담겨 있습니다.`
              : "담긴 선물이 없습니다."}
          </p>
        </div>

        {/* 본문 레이아웃 */}
        {isLoading ? (
          /* 스켈레톤 로딩 */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        ) : cartItems.length === 0 ? (
          /* 빈 장바구니 */
          <EmptyCart />
        ) : (
          /* 상품 목록 + 주문 요약 */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ── 왼쪽: 상품 목록 (2/3) ── */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map((item) => {
                const name = item.giftfinder?.상품명 ?? item.product_id;
                const category = item.giftfinder?.카테고리 ?? "기타";
                const price = item.giftfinder?.실제가격 ?? 0;
                const priceRange = item.giftfinder?.가격 ?? "";
                const imageUrl = getProductImage(item);
                const icon = getCategoryIcon(category);

                return (
                  <div
                    key={item.id}
                    className="group flex gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700 hover:shadow-md shadow-sm transition-all duration-300 animate-fade-in"
                  >
                    {/* 상품 이미지 */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-1.5 left-1.5 text-sm leading-none">
                        {icon}
                      </div>
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-violet-600 dark:text-violet-400">
                          {category}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-50 mt-0.5 truncate">
                          {name}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                          예산 구간: {priceRange || "1~3만원"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-base font-bold text-slate-800 dark:text-zinc-100">
                          {`${price.toLocaleString()}원`}
                        </span>
                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 transition-all duration-200"
                          aria-label={`${name} 삭제`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 모바일용 X 버튼 (우상단) */}
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="sm:hidden self-start mt-0.5 p-1 text-slate-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400 transition-colors"
                      aria-label="삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── 오른쪽: 주문 요약 (1/3) ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                {/* 상단 포인트 라인 */}
                <div className="h-1 bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500" />

                <div className="p-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-5 tracking-tight">
                    주문 요약
                  </h2>

                  {/* 상품별 소계 */}
                  <div className="space-y-2.5 mb-5">
                    {cartItems.map((item) => {
                      const name = item.giftfinder?.상품명 ?? item.product_id;
                      const price = item.giftfinder?.실제가격 ?? 0;
                      const priceRange = item.giftfinder?.가격 ?? "";
                      return (
                        <div key={item.id} className="flex justify-between items-start gap-2">
                          <span className="text-xs text-slate-500 dark:text-zinc-400 truncate flex-1 leading-relaxed">
                            {name}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 shrink-0">
                            {`${price.toLocaleString()}원`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-slate-100 dark:border-zinc-800 my-4" />

                  {/* 총 합계 */}
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 dark:text-zinc-400">총 상품 수</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{cartCount}개</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">총 결제 금액</span>
                    <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                      {`${totalPrice.toLocaleString()}원`}
                    </span>
                  </div>

                  {/* 구매하기 버튼 */}
                  <button
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
                    onClick={() => setIsShippingModalOpen(true)}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "구매하기"
                    )}
                  </button>

                  {/* 쇼핑 계속하기 링크 */}
                  <Link
                    href="/survey"
                    className="mt-3 w-full py-3 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    선물 더 찾아보기
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 수령인 배송지 정보 입력 모달 */}
      {isShippingModalOpen && (
        <ShippingModal
          onClose={() => setIsShippingModalOpen(false)}
          onSubmit={handleCheckout}
          defaultEmail={user.email}
          defaultName={user.user_metadata?.name || user.user_metadata?.full_name || ""}
        />
      )}

      {/* 푸터 */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-900">
        <p>Designed & Developed by Seonjeong Noh</p>
      </footer>
    </div>
  );
}

