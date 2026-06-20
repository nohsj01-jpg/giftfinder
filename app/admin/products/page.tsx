"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  X,
  Upload,
} from "lucide-react";

interface Product {
  상품명: string;
  카테고리: string;
  가격: string;
  실제가격: number;
  "추천 성별": string;
  "추천 연령대": string;
  "추천 관계": string;
  "추천 취미": string;
  "추천 성격": string;
  "추천 이벤트": string;
  이미지URL: string;
  구매링크: string;
}

const CATEGORIES = ["디지털/IT", "문구/데스크테리어", "취미/레저", "뷰티", "식품/커피", "패션잡화", "리빙/인테리어"];
const PRICE_RANGES = ["1만원 이하", "1~3만원", "3~5만원", "5~10만원", "10만원 이상"];
const GENDERS = ["남성", "여성", "상관없음"];
const AGE_GROUPS = ["10대", "20대 초반", "20대 후반", "30대", "40대 이상", "상관없음"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedPriceRange, setSelectedPriceRange] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 11;

  // Modal states
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

  // Confirmation states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState<"save" | "delete" | "bulk" | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [pendingDeleteName, setPendingDeleteName] = useState("");

  // CSV states
  const [parsedCsvProducts, setParsedCsvProducts] = useState<Product[]>([]);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState(false);
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all products via secure API route
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setProducts((result.data as Product[]) || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter application
  useEffect(() => {
    let result = [...products];

    if (searchQuery) {
      result = result.filter(p => 
        p.상품명.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "전체") {
      result = result.filter(p => p.카테고리 === selectedCategory);
    }

    if (selectedPriceRange !== "전체") {
      result = result.filter(p => p.가격 === selectedPriceRange);
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchQuery, selectedCategory, selectedPriceRange]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const getVisiblePages = () => {
    const half = 2;
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (currentPage <= half) {
      end = Math.min(totalPages, 5);
    } else if (currentPage > totalPages - half) {
      start = Math.max(1, totalPages - 4);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Open confirmation wrapper
  const triggerConfirmation = (title: string, desc: string, type: "save" | "delete" | "bulk", deleteName = "") => {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setConfirmType(type);
    if (deleteName) setPendingDeleteName(deleteName);
    setShowConfirmModal(true);
  };

  // CRUD Actions
  const handleOpenAddModal = () => {
    setModalMode("add");
    setCurrentProduct({
      상품명: "",
      카테고리: CATEGORIES[0],
      가격: PRICE_RANGES[0],
      실제가격: 10000,
      "추천 성별": "상관없음",
      "추천 연령대": "20대 초반",
      "추천 관계": "친구",
      "추천 취미": "독서",
      "추천 성격": "무난함",
      "추천 이벤트": "생일",
      이미지URL: "",
      구매링크: ""
    });
    setIsCrudModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setModalMode("edit");
    setCurrentProduct({ ...product });
    setIsCrudModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.상품명) return;

    triggerConfirmation(
      modalMode === "add" ? "상품 추가 확인" : "상품 수정 확인",
      `"${currentProduct.상품명}" 상품을 데이터베이스에 반영하시겠습니까?`,
      "save"
    );
  };

  const handleDeleteProduct = (name: string) => {
    triggerConfirmation(
      "상품 삭제 확인",
      `"${name}" 상품을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      "delete",
      name
    );
  };

  // Execution Handlers on Confirm
  const handleConfirmClick = async () => {
    setShowConfirmModal(false);

    if (confirmType === "save") {
      setIsActionLoading(true);
      try {
        const method = modalMode === "add" ? "POST" : "PUT";
        const res = await fetch("/api/admin/products", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentProduct)
        });
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        alert(modalMode === "add" ? "상품이 추가되었습니다." : "상품이 수정되었습니다.");
        setIsCrudModalOpen(false);
        fetchProducts();
      } catch (err: any) {
        console.error(err);
        alert("저장 중 오류가 발생했습니다: " + err.message);
      } finally {
        setIsActionLoading(false);
      }
    } else if (confirmType === "delete") {
      setIsActionLoading(true);
      try {
        const res = await fetch(`/api/admin/products?name=${encodeURIComponent(pendingDeleteName)}`, {
          method: "DELETE"
        });
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        alert("상품이 삭제되었습니다.");
        fetchProducts();
      } catch (err: any) {
        console.error(err);
        alert("삭제 중 오류가 발생했습니다: " + err.message);
      } finally {
        setIsActionLoading(false);
      }
    } else if (confirmType === "bulk") {
      setIsActionLoading(true);
      setCsvUploadProgress(true);
      try {
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedCsvProducts)
        });

        const result = await res.json();
        if (result.error) throw new Error(result.error);

        alert(`성공적으로 ${parsedCsvProducts.length}개의 상품 등록이 완료되었습니다.`);
        setIsCsvModalOpen(false);
        fetchProducts();
      } catch (err: any) {
        console.error(err);
        alert("일괄 업로드 중 오류가 발생했습니다: " + err.message);
      } finally {
        setIsActionLoading(false);
        setCsvUploadProgress(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  // CSV Parsing Helper
  const parseCSV = (text: string): Product[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return [];

    const result: Product[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          cols.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      cols.push(current.trim());

      if (cols.length >= 10) {
        result.push({
          상품명: cols[0].replace(/^"|"$/g, "").trim(),
          카테고리: cols[1].replace(/^"|"$/g, "").trim(),
          가격: cols[2].replace(/^"|"$/g, "").trim(),
          실제가격: parseInt(cols[3], 10) || 0,
          "추천 성별": cols[4].replace(/^"|"$/g, "").trim(),
          "추천 연령대": cols[5].replace(/^"|"$/g, "").trim(),
          "추천 관계": cols[6].replace(/^"|"$/g, "").trim(),
          "추천 취미": cols[7].replace(/^"|"$/g, "").trim(),
          "추천 성격": cols[8].replace(/^"|"$/g, "").trim(),
          "추천 이벤트": cols[9].replace(/^"|"$/g, "").trim(),
          이미지URL: cols[10] ? cols[10].replace(/^"|"$/g, "").trim() : "",
          구매링크: cols[11] ? cols[11].replace(/^"|"$/g, "").trim() : ""
        });
      }
    }
    return result;
  };

  // CSV Upload Trigger
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setCsvError("파싱된 상품이 없습니다. CSV 포맷을 확인해 주세요.");
        } else {
          setParsedCsvProducts(parsed);
          setIsCsvModalOpen(true);
        }
      } catch (err: any) {
        setCsvError("CSV 파일을 파싱하는 데 실패했습니다: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // Run Bulk Upload via Secure Endpoints
  const handleBulkUpload = async () => {
    if (parsedCsvProducts.length === 0) return;
    setIsActionLoading(true);
    setCsvUploadProgress(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedCsvProducts)
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      alert(`성공적으로 ${parsedCsvProducts.length}개의 상품 등록이 완료되었습니다.`);
      setIsCsvModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert("일괄 업로드 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsActionLoading(false);
      setCsvUploadProgress(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">상품 데이터 관리</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            추천 로직에 사용하는 300여개의 상품 데이터베이스를 직접 조회하고 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-zinc-300"
          >
            <Upload className="w-4 h-4" />
            CSV 일괄 등록
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCsvFileChange}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 shadow-md shadow-violet-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            단일 상품 추가
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="상품명 검색.."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 rounded-xl text-slate-900 dark:text-zinc-50 placeholder-slate-400 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-450 dark:text-zinc-500 font-semibold">카테고리</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              <option value="전체">전체</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-450 dark:text-zinc-500 font-semibold">가격대</span>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              <option value="전체">전체</option>
              {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-850 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
            <p className="text-xs text-slate-450 dark:text-zinc-500 font-semibold">
              상품 데이터베이스 조회 중..
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-slate-400 dark:text-zinc-505 font-medium">검색 조건에 맞는 상품이 존재하지 않습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/55 dark:bg-zinc-950/20 text-slate-400 dark:text-zinc-550 border-b border-slate-100 dark:border-zinc-850">
                    <th className="px-6 py-3.5 font-bold uppercase">상품명</th>
                    <th className="px-6 py-3.5 font-bold uppercase">카테고리</th>
                    <th className="px-6 py-3.5 font-bold uppercase">가격대 (실제가)</th>
                    <th className="px-6 py-3.5 font-bold uppercase">성별/연령대</th>
                    <th className="px-6 py-3.5 font-bold uppercase">추천 성격</th>
                    <th className="px-6 py-3.5 font-bold uppercase">추천 취미</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-center">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                  {paginatedProducts.map((p) => (
                    <tr key={p.상품명} className="hover:bg-slate-50/30 dark:hover:bg-zinc-950/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-zinc-150 max-w-xs truncate">
                        {p.상품명}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-600 dark:text-zinc-300">
                          {p.카테고리}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-zinc-300">
                        {p.가격} <span className="text-[10px] text-slate-400">({p.실제가격.toLocaleString()}원)</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-zinc-400">
                        {p["추천 성별"]} / {p["추천 연령대"]}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-[120px] truncate" title={p["추천 성격"]}>
                        {p["추천 성격"]}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-[120px] truncate" title={p["추천 취미"]}>
                        {p["추천 취미"]}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.상품명)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-center gap-4 relative">
              <div className="sm:absolute sm:left-6 text-xs text-slate-500 dark:text-zinc-400 select-none">
                Page <span className="font-bold text-slate-800 dark:text-zinc-200">{currentPage}</span> of {totalPages}
              </div>
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`text-xs font-semibold transition-colors cursor-pointer select-none ${
                    currentPage === 1
                      ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed"
                      : "text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1.5">
                  {getVisiblePages().map((page) => (
                    <button
                      type="button"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center text-xs rounded-xl transition-all cursor-pointer select-none ${
                        currentPage === page
                          ? "font-bold text-white bg-indigo-600 shadow-md shadow-indigo-500/20"
                          : "font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`text-xs font-semibold transition-colors cursor-pointer select-none ${
                    currentPage === totalPages
                      ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed"
                      : "text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
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
                onClick={handleConfirmClick}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-rose-650 hover:bg-rose-550 dark:bg-rose-500 dark:hover:bg-rose-450 transition-all cursor-pointer disabled:opacity-50"
              >
                {isActionLoading ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD MODAL */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-violet-600 to-indigo-650" />
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {modalMode === "add" ? "단일 상품 등록" : "상품 정보 수정"}
              </h3>
              <button
                onClick={() => setIsCrudModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">상품명</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === "edit"}
                    value={currentProduct.상품명 || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, 상품명: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">카테고리</label>
                  <select
                    value={currentProduct.카테고리 || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, 카테고리: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">가격구분</label>
                  <select
                    value={currentProduct.가격 || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, 가격: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  >
                    {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">실제가격(원)</label>
                  <input
                    type="number"
                    required
                    value={currentProduct.실제가격 || 0}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, 실제가격: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">추천 성별</label>
                  <select
                    value={currentProduct["추천 성별"] || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, "추천 성별": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">추천 연령대</label>
                  <select
                    value={currentProduct["추천 연령대"] || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, "추천 연령대": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  >
                    {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">추천 관계(쉼표 구분)</label>
                  <input
                    type="text"
                    value={currentProduct["추천 관계"] || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, "추천 관계": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">추천 취미(쉼표 구분)</label>
                  <input
                    type="text"
                    value={currentProduct["추천 취미"] || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, "추천 취미": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">추천 성격(쉼표 구분)</label>
                  <input
                    type="text"
                    value={currentProduct["추천 성격"] || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, "추천 성격": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">추천 이벤트(쉼표 구분)</label>
                  <input
                    type="text"
                    value={currentProduct["추천 이벤트"] || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, "추천 이벤트": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">이미지 URL</label>
                <input
                  type="text"
                  value={currentProduct.이미지URL || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, 이미지URL: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">구매 링크</label>
                <input
                  type="text"
                  value={currentProduct.구매링크 || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, 구매링크: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV UPLOAD MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base">CSV 일괄 등록 확인</h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 rounded-full text-slate-450 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-xs text-left">
              <p className="text-slate-655 dark:text-zinc-400">
                선택한 파일에서 총 <span className="font-bold text-violet-600">{parsedCsvProducts.length}개</span>의 상품이 파싱되었습니다.
              </p>
              <p className="text-rose-600 dark:text-rose-450 font-medium">
                ⚠️ 주의: 일괄 업로드 시 기존 상품 데이터베이스의 상품들이 모두 제거되고 새로운 CSV 파일의 상품들로 대체됩니다.
              </p>
              {csvError && (
                <p className="text-rose-600 font-medium">{csvError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={isActionLoading || csvUploadProgress}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-violet-600 hover:bg-violet-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {csvUploadProgress ? "업로드 중..." : "업로드 시작"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
