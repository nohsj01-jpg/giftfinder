"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Users as UsersIcon, RefreshCw, Mail, Calendar, ChevronRight, X, ShoppingBag } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  purchaseCount: number;
  totalSpent: number;
}

interface OrderItem {
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const supabase = createClient();

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch profiles from API
      const uRes = await fetch("/api/admin/users");
      const uResult = await uRes.json();
      if (uResult.error) throw new Error(uResult.error);
      const rawUsers = uResult.data || [];

      // 2. Fetch orders from API
      const oRes = await fetch("/api/admin/orders");
      const oResult = await oRes.json();
      if (oResult.error) throw new Error(oResult.error);
      const orderList: Order[] = oResult.data || [];
      setAllOrders(orderList);

      // Calculate totals mapping by user_id
      const userStats: Record<string, { count: number; spent: number }> = {};
      orderList.forEach(order => {
        // Safe mapping
        const userId = (order as any).user_id;
        if (!userId) return;

        if (!userStats[userId]) {
          userStats[userId] = { count: 0, spent: 0 };
        }
        if (order.status === "completed" || order.status === "완료" || order.status === "결제완료" || order.status === "PAID") {
          userStats[userId].count += 1;
          userStats[userId].spent += (order.total_price || 0);
        }
      });

      const formattedUsers: Profile[] = rawUsers.map((u: any) => ({
        ...u,
        purchaseCount: userStats[u.id]?.count || 0,
        totalSpent: userStats[u.id]?.spent || 0
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = async (user: Profile) => {
    setSelectedUser(user);
    setIsLoadingOrders(true);
    try {
      // Filter in-memory orders matching user.id
      const userOrders = allOrders.filter((o: any) => o.user_id === user.id);
      setSelectedUserOrders(userOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Compute total purchased products for the selected user (from product names)
  const getPurchasedProducts = () => {
    const productMap: Record<string, number> = {};
    selectedUserOrders.forEach(order => {
      order.order_items.forEach(item => {
        if (item.product_name) {
          productMap[item.product_name] = (productMap[item.product_name] || 0) + 1;
        }
      });
    });
    return Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const topProducts = getPurchasedProducts();

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-medium">회원 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            서비스 가입 회원들의 매출 기여도 및 소비 성향 분석 데이터를 확인합니다.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main List */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <UsersIcon className="w-8 h-8 mx-auto stroke-1 mb-2" />
              <p className="text-sm font-medium">가입된 회원 정보가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/55 dark:bg-zinc-950/20 text-slate-400 dark:text-zinc-550 border-b border-slate-100 dark:border-zinc-850">
                    <th className="px-6 py-3.5 font-bold uppercase">회원명</th>
                    <th className="px-6 py-3.5 font-bold uppercase">이메일</th>
                    <th className="px-6 py-3.5 font-bold uppercase">가입일</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-center">구매 횟수</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-right">총 결제액</th>
                    <th className="px-4 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                  {users.map((u) => (
                    <tr 
                      key={u.id} 
                      onClick={() => handleSelectUser(u)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-zinc-950/10 transition-colors cursor-pointer ${
                        selectedUser?.id === u.id ? "bg-slate-100/50 dark:bg-zinc-800/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200/50">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                            ) : (
                              <UsersIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-zinc-150">{u.display_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-zinc-400">{u.email}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-slate-700 dark:text-zinc-300">
                        {u.purchaseCount}회
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-zinc-50 font-mono">
                        ₩{u.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ChevronRight className="w-4 h-4 text-slate-350" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected User Detail Pane */}
        {selectedUser && (
          <div className="w-full lg:w-96 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-md p-6 space-y-6 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  {selectedUser.display_name} 회원 상세
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedUser.email}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Purchased Products Analysis */}
            <div className="space-y-4">
              <h4 className="font-bold text-[10px] text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                구매 상품 분석
              </h4>
              
              <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850">
                {topProducts.length === 0 ? (
                  <span className="text-[10px] text-slate-400">구매 이력 없음</span>
                ) : (
                  topProducts.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 dark:text-zinc-300 truncate max-w-[70%]" title={name}>{name}</span>
                      <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 shrink-0">{count}회</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-3">
              <h4 className="font-bold text-[10px] text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                주문 내역
              </h4>

              {isLoadingOrders ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                </div>
              ) : selectedUserOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">완료된 주문이 존재하지 않습니다.</p>
              ) : (
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                  {selectedUserOrders.map(order => (
                    <div 
                      key={order.id}
                      className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between font-medium">
                        <span className="font-mono text-[10px] text-slate-450">{order.id.slice(0, 8)}...</span>
                        <span className="text-slate-500 text-[10px]">{new Date(order.ordered_at).toLocaleDateString()}</span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-zinc-200">
                        {order.order_items?.[0]?.product_name ?? "상품"}
                        {order.order_items && order.order_items.length > 1 && ` 외 ${order.order_items.length - 1}개`}
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="font-bold text-slate-700 dark:text-zinc-400">₩{order.total_price.toLocaleString()}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          order.status === "completed" 
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" 
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                        }`}>
                          {order.status === "completed" ? "결제완료" : "대기"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
