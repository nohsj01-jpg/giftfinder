"use client";

import Link from "next/link";
import { ShoppingCart, LogOut, User as UserIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import AdminPasswordModal from "@/components/AdminPasswordModal";

interface HeaderProps {
  maxWidthClass?: string;
  extra?: React.ReactNode;
}

export default function Header({ maxWidthClass = "max-w-4xl", extra }: HeaderProps) {
  const { cartCount, user, setIsLoginModalOpen, logout } = useCart();
  const [showPopover, setShowPopover] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const getDisplayName = () => {
    if (!user) return "사용자";
    return (
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "사용자"
    );
  };

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  };

  return (
    <header className="relative z-50 w-full border-b border-slate-100 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
      <div className={`w-full ${maxWidthClass} mx-auto px-6 py-4 flex items-center justify-between`}>
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-500/20 transition-transform group-hover:scale-105">
            G
          </div>
          <span className="font-bold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-400">
            GiftFinder<span className="text-violet-500 dark:text-violet-400">.ai</span>
          </span>
        </Link>

        {/* 내비게이션 요소들 */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/survey"
            className="text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 px-2.5 py-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          >
            선물 찾기
          </Link>

          {/* 주문내역 링크 */}
          {user ? (
            <Link
              href="/orders"
              className="text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 px-2.5 py-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              주문내역
            </Link>
          ) : (
            <button
              onClick={() => {
                sessionStorage.setItem("login_redirect", "/orders");
                setIsLoginModalOpen(true);
              }}
              className="text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 px-2.5 py-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              주문내역
            </button>
          )}

          {/* 관리자 인증 버튼 */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="text-slate-400 dark:text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 px-2 py-1 rounded hover:bg-slate-200/50 dark:hover:bg-zinc-900 transition-all cursor-pointer text-[10px]"
          >
            관리자
          </button>

          {/* 장바구니 아이콘 링크 + 뱃지 */}
          {user ? (
            <Link
              href="/cart"
              className="relative p-2 rounded-full text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-200/50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center"
              aria-label={`장바구니 ${cartCount > 0 ? `(${cartCount}개)` : ""}`}
            >
              <ShoppingCart className="w-5 h-5" />

              {/* cartCount > 0 일 때만 뱃지 렌더링 */}
              {cartCount > 0 && (
                <span className="cart-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          ) : (
            <button
              onClick={() => {
                sessionStorage.setItem("login_redirect", "/cart");
                setIsLoginModalOpen(true);
              }}
              className="relative p-2 rounded-full text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-200/50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center cursor-pointer"
              aria-label="장바구니"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}

          {/* 로그인 / 프로필 (아바타 팝오버) */}
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setShowPopover(true)}
              onMouseLeave={() => setShowPopover(false)}
            >
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-800 overflow-hidden bg-slate-100 dark:bg-zinc-800 focus:outline-none transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="프로필 메뉴 열기"
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()!}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                )}
              </button>

              {/* 프로필 팝오버 (Hover 시 노출) */}
              {showPopover && (
                <div className="absolute right-0 top-full pt-2 w-56 animate-fade-in z-50">
                  <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-xl overflow-hidden p-4">
                    <div className="mb-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                      <p className="font-bold text-slate-900 dark:text-zinc-50 truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowPopover(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-rose-500 dark:hover:text-rose-400 transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              로그인
            </button>
          )}

          {/* 설문 단계 또는 리셋 링크 */}
          {extra && (
            <div className="flex items-center border-l border-slate-200 dark:border-zinc-800 pl-3">
              {extra}
            </div>
          )}
        </div>
      </div>

      {/* 관리자 비밀번호 입력 모달 */}
      <AdminPasswordModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </header>
  );
}
