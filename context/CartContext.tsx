"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import LoginModal from "@/components/LoginModal";

// 장바구니 아이템 타입 정의
export interface CartItem {
  id: string; // uuid
  user_id: string; // uuid
  product_id: string; // 상품명 (giftfinder 테이블의 상품명 컬럼 참조)
  added_at: string;
  giftfinder?: {
    상품명: string;
    카테고리: string;
    가격: string;
    실제가격: number;
    "추천 성별"?: string;
    "추천 연령대"?: string;
    "추천 관계"?: string;
    "추천 취미"?: string;
    "추천 성격"?: string;
    "추천 이벤트"?: string;
    이미지URL?: string;
    구매링크?: string;
  };
}

// 토스트 메시지 타입
export interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

// Context 인터페이스 정의
interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  totalPrice: number;
  isLoading: boolean;
  user: User | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  isInCart: (productId: string) => boolean;
  showToast: (message: string, type?: Toast["type"]) => void;
  logout: () => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 토스트 메시지 함수
  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Auth 상태 모니터링
  useEffect(() => {
    // 최초 세션 로드
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 세션 변경 감지 리스너 등록
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 장바구니 데이터 로드 함수
  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, giftfinder(*)")
        .order("added_at", { ascending: false });

      if (error) {
        console.error("Error fetching cart items:", error);
      } else {
        setCartItems(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 상태 변화 시 장바구니 새로고침 및 리다이렉트 처리
  useEffect(() => {
    fetchCart();
    if (user) {
      const redirect = sessionStorage.getItem("login_redirect");
      if (redirect) {
        sessionStorage.removeItem("login_redirect");
        router.push(redirect);
      }
    }
  }, [user, router]);

  // 장바구니에 담겨있는지 여부 체크
  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.product_id === productId);
  };

  // 장바구니 추가
  const addToCart = async (product: any) => {
    // 1. 비로그인 상태인 경우 모달 노출
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // 상품 식별자 추출 (Recommendation 또는 Product 형태 지원)
    const productName = product.name || product.상품명 || product.id;
    if (!productName) {
      showToast("상품 정보가 올바르지 않습니다.", "error");
      return;
    }

    // 2. 이미 담겨있는 경우 예외 처리
    if (isInCart(productName)) {
      showToast("이미 장바구니에 담긴 상품입니다.", "warning");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: productName,
        })
        .select("*, giftfinder(*)")
        .single();

      if (error) {
        throw error;
      }

      setCartItems((prev) => [data, ...prev]);
      showToast("장바구니에 상품을 담았습니다.", "success");
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      showToast("장바구니 저장 중 오류가 발생했습니다.", "error");
    }
  };

  // 장바구니 제거
  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        throw error;
      }

      setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
      showToast("장바구니에서 상품을 삭제했습니다.", "success");
    } catch (err: any) {
      console.error("Error removing from cart:", err);
      showToast("장바구니 상품 삭제에 실패했습니다.", "error");
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast("로그아웃 되었습니다.", "info");
    } catch (err: any) {
      console.error("Logout error:", err);
      showToast("로그아웃 중 오류가 발생했습니다.", "error");
    }
  };

  // 담긴 상품 수 계산
  const cartCount = cartItems.length;

  // 총 합계 금액 계산 (giftfinder 테이블의 실제가격 합산)
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.giftfinder?.실제가격 || 0);
  }, 0);

  // 장바구니 비우기
  const clearCart = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
      setCartItems([]);
    } catch (err) {
      console.error("Error clearing cart:", err);
      showToast("장바구니 비우기에 실패했습니다.", "error");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        totalPrice,
        isLoading,
        user,
        isLoginModalOpen,
        setIsLoginModalOpen,
        addToCart,
        removeFromCart,
        isInCart,
        showToast,
        logout,
        clearCart,
      }}
    >
      {children}

      {/* 전역 토스트 팝업 컨테이너 */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md animate-slide-in transition-all duration-300 ${
              toast.type === "success"
                ? "bg-emerald-500/90 text-white border-emerald-400/30"
                : toast.type === "warning"
                ? "bg-amber-500/90 text-white border-amber-400/30"
                : toast.type === "error"
                ? "bg-rose-500/90 text-white border-rose-400/30"
                : "bg-slate-800/90 text-white border-slate-700/30"
            }`}
          >
            <span className="text-lg">
              {toast.type === "success"
                ? "✨"
                : toast.type === "warning"
                ? "⚠️"
                : toast.type === "error"
                ? "❌"
                : "ℹ️"}
            </span>
            <p className="text-xs font-medium tracking-tight leading-normal">
              {toast.message}
            </p>
          </div>
        ))}
      </div>

      {/* 전역 로그인 유도 모달 */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          showToast={showToast}
        />
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

