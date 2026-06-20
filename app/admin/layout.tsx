"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  Users as UsersIcon, 
  BarChart3, 
  ArrowLeft, 
  LogOut, 
  Loader2 
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth === "true") {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      router.replace("/");
    }
  }, [router, pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    router.replace("/");
  };

  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
          관리자 권한을 확인하고 있습니다...
        </p>
      </div>
    );
  }

  const menuItems = [
    { name: "대시보드", href: "/admin", icon: LayoutDashboard },
    { name: "상품 관리", href: "/admin/products", icon: ShoppingBag },
    { name: "주문 관리", href: "/admin/orders", icon: ShoppingCart },
    { name: "회원 관리", href: "/admin/users", icon: UsersIcon },
    { name: "통계 분석", href: "/admin/stats", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-zinc-850/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="메인 홈으로"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-rose-500">
                GiftFinder 관리자 센터
              </span>
              <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Area: Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Persistent Left Sidebar */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-zinc-850/80 bg-white dark:bg-zinc-900/40 p-4 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest px-3 mb-3">
            메뉴
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-zinc-150 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Content Window */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50/50 dark:bg-zinc-950/20 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
