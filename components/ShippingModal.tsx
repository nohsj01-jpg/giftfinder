"use client";

import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

declare global {
  interface Window {
    daum: any;
  }
}

export interface ShippingInfo {
  recipientName: string;
  recipientPhone: string;
  postcode: string;
  address: string;
  detailAddress: string;
  recipientEmail: string;
}

interface ShippingModalProps {
  onClose: () => void;
  onSubmit: (info: ShippingInfo) => void;
  defaultEmail?: string;
  defaultName?: string;
}

export default function ShippingModal({
  onClose,
  onSubmit,
  defaultEmail = "",
  defaultName = "",
}: ShippingModalProps) {
  const [recipientName, setRecipientName] = useState(defaultName);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);

  // Daum 우편번호 서비스 스크립트 로드
  useEffect(() => {
    const scriptId = "daum-postcode-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.id = scriptId;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePostcodeSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          let fullAddress = data.address;
          let extraAddress = "";

          if (data.addressType === "R") {
            if (data.bname !== "") {
              extraAddress += data.bname;
            }
            if (data.buildingName !== "") {
              extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
          }

          setPostcode(data.zonecode);
          setAddress(fullAddress);
        },
      }).open();
    } else {
      alert("우편번호 서비스 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    // 전화번호 포맷팅 (010-1234-5678 형식 자동 입력)
    if (value.length <= 3) {
      setRecipientPhone(value);
    } else if (value.length <= 7) {
      setRecipientPhone(`${value.slice(0, 3)}-${value.slice(3)}`);
    } else {
      setRecipientPhone(`${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      alert("수령인 이름을 입력해주세요.");
      return;
    }
    if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(recipientPhone)) {
      alert("올바른 연락처 형식을 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    if (!postcode || !address) {
      alert("주소를 검색하여 우편번호와 기본 주소를 입력해주세요.");
      return;
    }
    if (!detailAddress.trim()) {
      alert("상세 주소를 입력해주세요.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    onSubmit({
      recipientName,
      recipientPhone,
      postcode,
      address,
      detailAddress,
      recipientEmail,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 디자인 라인 */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-rose-500 to-amber-400" />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              선물 수령인 정보 입력
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
              선물을 받으실 분의 올바른 배송 및 연락처 정보를 정확히 기재해 주세요.
            </p>
          </div>

          <div className="space-y-4">
            {/* 수령인 이름 */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                수령인 이름
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 text-slate-900 dark:text-zinc-50 transition-all"
                required
              />
            </div>

            {/* 수령인 연락처 */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                수령인 연락처
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                maxLength={13}
                className="w-full px-4 py-3 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 text-slate-900 dark:text-zinc-50 transition-all"
                required
              />
            </div>

            {/* 배송지 주소 (우편번호 검색) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  우편번호
                </label>
                <input
                  type="text"
                  value={postcode}
                  readOnly
                  placeholder="우편번호"
                  className="w-full px-4 py-3 rounded-xl text-xs bg-slate-100 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 focus:outline-none text-slate-900 dark:text-zinc-50 transition-all cursor-not-allowed"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handlePostcodeSearch}
                  className="w-full py-3 rounded-xl text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/70 border border-violet-200/50 dark:border-violet-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>주소 검색</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                기본 주소
              </label>
              <input
                type="text"
                value={address}
                readOnly
                placeholder="주소 검색 버튼을 클릭해 주세요."
                className="w-full px-4 py-3 rounded-xl text-xs bg-slate-100 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 focus:outline-none text-slate-900 dark:text-zinc-50 transition-all cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                상세 주소
              </label>
              <input
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="동·호수 등 상세 주소 입력"
                className="w-full px-4 py-3 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 text-slate-900 dark:text-zinc-50 transition-all"
                required
              />
            </div>

            {/* 수령인 이메일 */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                수령인 이메일 (배송 알림용)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 text-slate-900 dark:text-zinc-50 transition-all"
                required
              />
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-zinc-800/80 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 transition-all shadow-md shadow-violet-500/20 cursor-pointer"
            >
              정보 저장 후 결제 진행
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
