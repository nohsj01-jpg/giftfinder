"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Gift, Calendar, Trash2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  product_id?: string;
  giftfinder?: {
    카테고리?: string;
    가격?: string;
    "추천 성별"?: string;
    "추천 연령대"?: string;
  };
}

interface Order {
  id: string;
  ordered_at: string;
  total_price: number;
  status: string;
  order_items: OrderItem[];
}

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

function getProductImage(productName: string, category: string): string {
  const name = productName.toLowerCase();
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

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading, setIsLoginModalOpen, showToast } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const supabase = createClient();

  const fetchOrders = async () => {
    if (!user) return;
    setIsOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          ordered_at,
          total_price,
          status,
          order_items (
            id,
            product_id,
            product_name,
            price,
            giftfinder (
              카테고리,
              가격,
              "추천 성별",
              "추천 연령대"
            )
          )
        `)
        .eq("user_id", user.id)
        .order("ordered_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/");
        setIsLoginModalOpen(true);
        return;
      }
      fetchOrders();
    }
  }, [user, isLoading, router, setIsLoginModalOpen]);

  // 주문 내역 삭제 (데이터베이스 내 완전 제거)
  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 상세 모달 방지
    if (!confirm("해당 주문 내역을 목록에서 정말 삭제하시겠습니까?")) return;

    setIsDeleteLoading(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)
        .eq("user_id", user?.id);

      if (error) throw error;

      showToast("주문 내역이 정상적으로 삭제되었습니다.", "success");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      console.error("Error deleting order:", err);
      showToast(err.message || "주문 삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setIsDeleteLoading(null);
    }
  };

  if (isLoading || isOrdersLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
        <Header maxWidthClass="max-w-5xl" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "신청완료";
      case "pending":
        return "대기중";
      case "cancelled":
        return "취소됨";
      default:
        return "신청완료";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      <Header maxWidthClass="max-w-5xl" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        {/* 페이지 타이틀 */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            주문 내역
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            선물한 기록을 확인하세요.
          </p>
        </div>



        {orders.length === 0 ? (
          /* 주문 내역이 없는 빈 화면 */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center border border-violet-100 dark:border-violet-900/30">
                <ShoppingBag className="w-10 h-10 text-violet-300 dark:text-violet-700" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-2xl">🛍️</span>
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2 tracking-tight">
              아직 주문한 내역이 없습니다.
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-xs">
              AI 추천을 통해 소중한 분을 위한<br />특별한 선물을 주문해 보세요!
            </p>

            <Link
              href="/survey"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 shadow-lg shadow-violet-600/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Gift className="w-4 h-4" />
              선물 둘러보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* 주문 목록 내역 */
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="group rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-zinc-800 transition-all duration-300 cursor-pointer overflow-hidden relative"
              >
                {/* 주문서 상단 헤더 */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/80 flex flex-wrap justify-between items-center gap-3 text-xs">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-slate-500 dark:text-zinc-400">
                      주문번호: <span className="font-semibold text-slate-700 dark:text-zinc-300">{order.id.substring(0, 8)}</span>
                    </div>
                    <div className="text-slate-300 dark:text-zinc-700 hidden sm:inline">|</div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        신청일시: {new Date(order.ordered_at).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full font-bold bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                      {getStatusLabel(order.status)}
                    </span>
                    {/* 내역 삭제 버튼 */}
                    <button
                      onClick={(e) => handleDeleteOrder(order.id, e)}
                      disabled={isDeleteLoading === order.id}
                      className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="주문 내역 삭제"
                    >
                      {isDeleteLoading === order.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 주문 상품 목록 */}
                <div className="p-6 divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {order.order_items?.map((item) => {
                    const category = item.giftfinder?.카테고리 || "기타";
                    const imageUrl = getProductImage(item.product_name, category);
                    return (
                      <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-violet-600 dark:text-violet-400">
                            {category}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-50 mt-0.5 truncate">
                            {item.product_name}
                          </h3>
                          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 mt-1">
                            {item.price.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 하단 총액 요약 및 삭제 버튼 */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 mr-2">총 결제 금액</span>
                    <span className="text-base sm:text-lg font-extrabold text-violet-600 dark:text-violet-400">
                      {order.total_price.toLocaleString()}원
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteOrder(order.id, e)}
                    disabled={isDeleteLoading === order.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-transparent hover:border-rose-200 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all duration-200 cursor-pointer"
                  >
                    {isDeleteLoading === order.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>주문 내역 삭제</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── 주문 상세 정보 모달 ─── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 포인트 라인 */}
            <div className="h-1 bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500" />

            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              {/* 모달 타이틀 */}
              <div className="mb-6">
                <span className="px-2.5 py-0.5 rounded bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 text-xxs font-bold">
                  {getStatusLabel(selectedOrder.status)}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mt-1.5">
                  주문 상세 정보
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 leading-normal">
                  주문 일시: {new Date(selectedOrder.ordered_at).toLocaleString("ko-KR")} <br />
                  주문 번호: {selectedOrder.id}
                </p>
              </div>

              {/* 주문 상품 상세 카드 리스트 */}
              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {selectedOrder.order_items?.map((item) => {
                  const category = item.giftfinder?.카테고리 || "기타";
                  const priceRange = item.giftfinder?.가격 || "";
                  const imageUrl = getProductImage(item.product_name, category);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/40"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-violet-600 dark:text-violet-400">
                            {category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mt-0.5 truncate">
                            {item.product_name}
                          </h4>
                          {priceRange && (
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                              예산 구간: {priceRange}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                            {item.price.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 하단 요약 및 주문 삭제 */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-zinc-400">총 상품 수</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                    {selectedOrder.order_items?.length || 0}개
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">총 결제 금액</span>
                  <span className="text-lg sm:text-xl font-extrabold text-violet-600 dark:text-violet-400">
                    {selectedOrder.total_price.toLocaleString()}원
                  </span>
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button
                    onClick={(e) => {
                      handleDeleteOrder(selectedOrder.id, e);
                    }}
                    disabled={isDeleteLoading === selectedOrder.id}
                    className="flex-1 py-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    주문 내역 삭제
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-200 cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-900">
        <p>Designed & Developed by Seonjeong Noh</p>
      </footer>
    </div>
  );
}
