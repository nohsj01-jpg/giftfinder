"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, X } from "lucide-react";

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPasswordModal({ isOpen, onClose }: AdminPasswordModalProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === "giftmaster123") {
      sessionStorage.setItem("adminAuth", "true");
      onClose();
      router.push("/admin");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 shadow-2xl overflow-hidden transform transition-all ${
          isShaking ? "animate-bounce" : ""
        }`}
        style={
          isShaking
            ? {
                animation: "shake 0.4s cubic-bezier(.36,.07,.19,.97) both",
                transform: "translate3d(0, 0, 0)",
              }
            : {}
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* CSS Keyframes for Shake effect */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
        `}} />

        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-all cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 pt-9">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-500 text-white shadow-lg shadow-violet-500/20 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              관리자 인증
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
              관리자 페이지에 진입하기 위해 비밀번호를 입력해주세요.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="비밀번호 입력"
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 text-slate-900 dark:text-zinc-50 placeholder-slate-400 dark:placeholder-zinc-600 transition-all"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {error && (
                <p className="text-[11px] text-rose-500 font-medium mt-2 animate-fade-in">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              인증 및 로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
