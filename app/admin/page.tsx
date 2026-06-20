"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users as UsersIcon, 
  ShoppingCart, 
  Loader2, 
  RefreshCw,
  CheckCircle2,
  Clock
} from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
}

interface Order {
  id: string;
  ordered_at: string;
  total_price: number;
  status: string;
  order_items: OrderItem[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    todayOrders: 0,
    monthlySales: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch total products count from giftfinder
      const { count: productCount, error: pError } = await supabase
        .from("giftfinder")
        .select("*", { count: "exact", head: true });

      // 2. Fetch total users count from auth.users via admin API
      const usersRes = await fetch("/api/admin/users");
      const usersResult = await usersRes.json();
      const finalUserCount = usersResult.data?.length ?? 0;

      // 3. Fetch orders for stats computation from API
      const res = await fetch("/api/admin/orders");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const orderList: Order[] = result.data || [];
      setOrders(orderList);

      // Compute Today's Orders and Monthly Sales
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let todayCount = 0;
      let monthSalesSum = 0;

      orderList.forEach(order => {
        const orderDate = new Date(order.ordered_at);
        const orderDateStr = order.ordered_at.split("T")[0];

        // Today's orders
        if (orderDateStr === todayStr) {
          todayCount++;
        }

        // This month's total sales
        if (orderDate >= startOfMonth && (order.status === "PAID" || order.status === "완료" || order.status === "결제완료" || order.status === "completed")) {
          monthSalesSum += (order.total_price || 0);
        }
      });

      setStats({
        totalProducts: productCount || 0,
        totalUsers: finalUserCount || 1, // fallback to 1 if user trigger hasn't run yet
        todayOrders: todayCount,
        monthlySales: monthSalesSum
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <p className="text-xs text-slate-450 dark:text-zinc-500 font-medium">
          데이터를 불러오고 있습니다...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">시스템 대시보드</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            GiftFinder 서비스의 실시간 주요 지표 및 최근 주문을 확인합니다.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Products */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-16 h-16 text-violet-600" />
          </div>
          <p className="text-[11px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-2">
            전체 상품 수
          </p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {stats.totalProducts.toLocaleString()}개
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-3 font-medium">
            추천 알고리즘용 데이터베이스 적재 수
          </p>
        </div>

        {/* Card 2: Total Users */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform">
            <UsersIcon className="w-16 h-16 text-indigo-500" />
          </div>
          <p className="text-[11px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-2">
            전체 회원 수
          </p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {stats.totalUsers.toLocaleString()}명
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-3 font-medium">
            가입 회원 및 복제 유저 수
          </p>
        </div>

        {/* Card 3: Today's Orders */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-16 h-16 text-rose-500" />
          </div>
          <p className="text-[11px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-2">
            오늘 주문 건수
          </p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {stats.todayOrders}건
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-3 font-medium">
            금일 00:00시 기준 실시간 결제 요청 수
          </p>
        </div>

        {/* Card 4: This Month's Total Sales */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-[11px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-2">
            이번 달 총 매출
          </p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            ₩{stats.monthlySales.toLocaleString()}
          </h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-3 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            이번 달 결제 완료 매출 합계
          </p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-850 flex items-center justify-between">
          <h3 className="font-bold text-base">최근 주문 현황</h3>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            최근 {Math.min(orders.length, 5)}건 표시
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-400 dark:text-zinc-505 font-medium">
              등록된 주문 내역이 없습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/55 dark:bg-zinc-950/20 text-slate-400 dark:text-zinc-550 border-b border-slate-100 dark:border-zinc-850">
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">주문 ID</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">결제 시간</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">상품 목록</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-right">금액</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                {orders.slice(0, 5).map((order) => {
                  const isPaid = order.status === "PAID" || order.status === "결제완료" || order.status === "완료" || order.status === "completed";
                  return (
                    <tr 
                      key={order.id}
                      className="hover:bg-slate-50/30 dark:hover:bg-zinc-950/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-slate-500 dark:text-zinc-400 text-[10px]">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-zinc-400">
                        {new Date(order.ordered_at).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 max-w-xs md:max-w-md">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                          {order.order_items?.[0]?.product_name ?? "상품 정보 없음"}
                        </div>
                        {order.order_items && order.order_items.length > 1 && (
                          <div className="text-[10px] text-slate-400 dark:text-zinc-550 mt-0.5">
                            외 {order.order_items.length - 1}개 품목
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-zinc-50 font-mono">
                        ₩{order.total_price?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}>
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              결제완료
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              대기중
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
