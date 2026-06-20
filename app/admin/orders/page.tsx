"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  X
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
  users: {
    display_name: string;
    email: string;
  } | null;
  order_items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  
  // Confirmation states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");

  const supabase = createClient();

  const fetchOrders = async () => {
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
    fetchOrders();
  }, []);

  const triggerConfirmation = (title: string, desc: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    const action = async () => {
      setIsUpdatingStatus(orderId);
      try {
        const res = await fetch("/api/admin/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus })
        });
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        alert("주문 결제 상태가 변경되었습니다.");
        fetchOrders();
      } catch (err: any) {
        console.error(err);
        alert("결제 상태 업데이트 실패: " + err.message);
      } finally {
        setIsUpdatingStatus(null);
        setShowConfirmModal(false);
      }
    };

    const statusNames: Record<string, string> = {
      pending: "결제 대기 (Pending)",
      completed: "결제 완료 (Completed)",
      cancelled: "결제 취소 (Cancelled)"
    };

    triggerConfirmation(
      "주문 상태 변경 확인",
      `주문번호 "${orderId.slice(0, 8)}..."의 상태를 [${statusNames[newStatus]}]로 변경하시겠습니까?`,
      action
    );
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // CSV Export
  const downloadCSV = () => {
    try {
      const headers = ["주문 ID", "구매자", "이메일", "결제 일시", "결제 금액", "상태", "상품 목록"];
      const rows = orders.map(order => {
        const buyer = order.users?.display_name || "사용자";
        const email = order.users?.email || "";
        const date = new Date(order.ordered_at).toLocaleString();
        const price = order.total_price;
        const status = order.status;
        const items = order.order_items.map(item => `${item.product_name}(${item.price}원)`).join(" | ");
        return [order.id, buyer, email, date, price, status, `"${items}"`].join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `GiftFinder_Orders_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Export Error:", err);
      alert("CSV 다운로드 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-medium">주문 내역을 로딩 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">주문 관리</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            결제 및 주문 요청 건수 전체 내역을 확인하고 상태를 제어합니다.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            엑셀/CSV 다운로드
          </button>
          
          <button
            onClick={fetchOrders}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-400 dark:text-zinc-500">주문 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/55 dark:bg-zinc-950/20 text-slate-400 dark:text-zinc-550 border-b border-slate-100 dark:border-zinc-850">
                  <th className="px-6 py-3.5 font-bold uppercase w-10"></th>
                  <th className="px-4 py-3.5 font-bold uppercase">주문 ID</th>
                  <th className="px-6 py-3.5 font-bold uppercase">구매자</th>
                  <th className="px-6 py-3.5 font-bold uppercase">주문 일시</th>
                  <th className="px-6 py-3.5 font-bold uppercase text-right">결제 금액</th>
                  <th className="px-6 py-3.5 font-bold uppercase text-center w-40">결제 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                {orders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  const buyerName = order.users?.display_name || "사용자";
                  const buyerEmail = order.users?.email || "";
                  
                  return (
                    <React.Fragment key={order.id}>
                      {/* Base Row */}
                      <tr 
                        className="hover:bg-slate-50/30 dark:hover:bg-zinc-950/10 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <td className="px-6 py-4 text-center">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 mx-auto" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                          {order.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 dark:text-zinc-100">{buyerName}</div>
                          {buyerEmail && <div className="text-[10px] text-slate-400 mt-0.5">{buyerEmail}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-650 dark:text-zinc-400">
                          {new Date(order.ordered_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-zinc-50 font-mono">
                          ₩{order.total_price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {isUpdatingStatus === order.id ? (
                            <Loader2 className="w-4 h-4 text-violet-600 animate-spin mx-auto" />
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500/60 cursor-pointer ${
                                order.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40"
                                  : order.status === "cancelled"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/40"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40"
                              }`}
                            >
                              <option value="pending">대기중</option>
                              <option value="completed">결제완료</option>
                              <option value="cancelled">취소됨</option>
                            </select>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/40 dark:bg-zinc-950/5">
                          <td colSpan={6} className="px-8 py-5 border-t border-b border-slate-100 dark:border-zinc-850">
                            <div className="space-y-3">
                              <h4 className="font-bold text-[11px] text-slate-450 dark:text-zinc-400 uppercase tracking-widest">
                                주문 상품 목록 ({order.order_items.length}개)
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {order.order_items.map((item) => (
                                  <div 
                                    key={item.id}
                                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between"
                                  >
                                    <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200 line-clamp-2">
                                      {item.product_name}
                                    </span>
                                    <span className="font-bold text-xs text-violet-600 dark:text-violet-400 mt-2 font-mono">
                                      ₩{item.price.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-2xl p-6 text-center space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{confirmTitle}</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{confirmDesc}</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={confirmAction}
                disabled={isUpdatingStatus !== null}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 transition-all cursor-pointer disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
