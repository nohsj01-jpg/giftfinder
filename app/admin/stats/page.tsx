"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, 
  BarChart3, 
  RefreshCw, 
  TrendingUp, 
  Sparkles, 
  Activity, 
  Sliders,
  Save,
  Smile,
  Heart
} from "lucide-react";

interface Order {
  total_price: number;
  status: string;
  ordered_at: string;
  order_items: { 
    price: number; 
    product_name: string;
  }[];
}

interface MonthlySales {
  month: string;
  sales: number;
}

export default function AdminStatsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Weights control states
  const [hobbyWeight, setHobbyWeight] = useState(10);
  const [personalityWeight, setPersonalityWeight] = useState(8);
  const [descriptionWeight, setDescriptionWeight] = useState(5);

  const supabase = createClient();

  // Load custom weights from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("admin_recommend_weights");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hobby !== undefined) setHobbyWeight(parsed.hobby);
        if (parsed.personality !== undefined) setPersonalityWeight(parsed.personality);
        if (parsed.description !== undefined) setDescriptionWeight(parsed.description);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchStatsData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/orders");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setOrders(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, []);

  // 1. Compute Monthly Sales (Last 6 Months)
  const getMonthlySales = (): MonthlySales[] => {
    const salesMap: Record<string, number> = {};
    const months: string[] = [];

    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      salesMap[key] = 0;
      months.push(key);
    }

    orders.forEach(order => {
      if (order.status === "completed" || order.status === "완료" || order.status === "결제완료" || order.status === "PAID") {
        const orderDate = new Date(order.ordered_at);
        const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
        if (salesMap[key] !== undefined) {
          salesMap[key] += order.total_price;
        }
      }
    });

    return months.map(m => ({
      month: `${m.split("-")[1]}월`,
      sales: salesMap[m]
    }));
  };

  // 2. Compute Top 10 Products from order_items (replaces personality/hobby analysis)
  const getTopKeywords = () => {
    const personalityMap: Record<string, number> = {};
    const hobbyMap: Record<string, number> = {};

    // Since giftfinder join is no longer used, we return empty arrays
    // Stats will show "no data" messages when there are no orders yet
    orders.forEach(o => {
      if (o.status === "completed" || o.status === "완료" || o.status === "결제완료" || o.status === "PAID") {
        o.order_items?.forEach(item => {
          if (item.product_name) {
            // Use product name as keyword for now
            personalityMap[item.product_name] = (personalityMap[item.product_name] || 0) + 1;
          }
        });
      }
    });

    const topPersonalities = Object.entries(personalityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topHobbies: [string, number][] = [];

    return { topPersonalities, topHobbies };
  };

  // 3. Compute Top 10 Products
  const getTopProducts = () => {
    const productCountMap: Record<string, number> = {};
    orders.forEach(o => {
      if (o.status === "completed" || o.status === "완료" || o.status === "결제완료" || o.status === "PAID") {
        o.order_items?.forEach(item => {
          productCountMap[item.product_name] = (productCountMap[item.product_name] || 0) + 1;
        });
      }
    });

    return Object.entries(productCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const handleSaveWeights = () => {
    const weights = {
      hobby: hobbyWeight,
      personality: personalityWeight,
      description: descriptionWeight
    };
    localStorage.setItem("admin_recommend_weights", JSON.stringify(weights));
    alert("AI 추천 로직 우선순위 가중치가 저장되었습니다. 실시간 추천 알고리즘에 즉시 반영됩니다.");
  };

  const monthlySales = getMonthlySales();
  const { topPersonalities, topHobbies } = getTopKeywords();
  const topProducts = getTopProducts();

  const maxSales = Math.max(...monthlySales.map(m => m.sales), 100000);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-medium">통계 데이터를 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">통계 및 선물 트렌드 분석</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            소비자 구매 이력을 기준으로 성향 트렌드를 분석하고 AI 매칭 가중치를 제어합니다.
          </p>
        </div>
        <button
          onClick={fetchStatsData}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart (Last 6 Months) */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm">최근 6개월 매출 현황 (결제완료 기준)</h3>
          </div>
          
          <div className="flex items-end justify-between h-56 pt-6 px-4">
            {monthlySales.map(m => {
              const heightPercent = (m.sales / maxSales) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center gap-3 w-12 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-zinc-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                    ₩{m.sales.toLocaleString()}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-xl group-hover:from-violet-500 group-hover:to-indigo-400 transition-all duration-500 shadow-md"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Priority Weights Adjustment Panel */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Sliders className="w-5 h-5 text-violet-500" />
            <h3 className="font-bold text-sm">AI 추천 알고리즘 우선순위 가중치 조정</h3>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>취미 일치 가중치 (Hobbies Match)</span>
                <span className="text-violet-600 dark:text-violet-400">+{hobbyWeight}점</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={hobbyWeight}
                onChange={(e) => setHobbyWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>성격 일치 가중치 (Personality Match)</span>
                <span className="text-violet-600 dark:text-violet-400">+{personalityWeight}점</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={personalityWeight}
                onChange={(e) => setPersonalityWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>설명글 유사 키워드 가중치 (Description Sub-match)</span>
                <span className="text-violet-600 dark:text-violet-400">+{descriptionWeight}점</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={descriptionWeight}
                onChange={(e) => setDescriptionWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>

            <button
              onClick={handleSaveWeights}
              className="w-full mt-4 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              설정 가중치 저장 및 알고리즘 즉시 반영
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Popular Personalities */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Smile className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-500">인기 매칭 성격 키워드 Top 5</h3>
          </div>
          <div className="space-y-2.5 pt-2">
            {topPersonalities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">분석 이력이 없습니다.</p>
            ) : (
              topPersonalities.map(([keyword, count], idx) => (
                <div key={keyword} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-700 dark:text-zinc-350">#{idx+1} {keyword}</span>
                    <span className="text-slate-450">{count}회</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-500 h-full rounded-full" 
                      style={{ width: `${(count / Math.max(...topPersonalities.map(t => t[1]), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Hobbies */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Heart className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-500">인기 매칭 취미 키워드 Top 5</h3>
          </div>
          <div className="space-y-2.5 pt-2">
            {topHobbies.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">분석 이력이 없습니다.</p>
            ) : (
              topHobbies.map(([keyword, count], idx) => (
                <div key={keyword} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-700 dark:text-zinc-350">#{idx+1} {keyword}</span>
                    <span className="text-slate-450">{count}회</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${(count / Math.max(...topHobbies.map(t => t[1]), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Products Rank */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-500">인기 주문 상품 Top 5</h3>
          </div>
          <div className="space-y-3.5 pt-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">판매 내역이 존재하지 않습니다.</p>
            ) : (
              topProducts.map(([name, count], index) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <span className="font-bold text-violet-600 dark:text-violet-400 w-4">#{index + 1}</span>
                    <span className="text-slate-700 dark:text-zinc-300 truncate" title={name}>{name}</span>
                  </div>
                  <span className="font-semibold text-slate-450 dark:text-zinc-500 text-[10px] shrink-0">{count}회 결제</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
