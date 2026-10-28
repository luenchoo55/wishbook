"use client";

import { useEffect } from "react";
import { useDialog } from "@/lib/dialog";

export default function DialogHost() {
  const d = useDialog();

  useEffect(() => {
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") d.resolve(false);
      if (e.key === "Enter") {
        e.preventDefault();
        d.resolve(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d]);

  if (!d) return null;

  const icon = d.icon ?? (d.danger ? "✂" : d.alertOnly ? "✒" : "⚜");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-6 backdrop-blur-[2px]"
      onClick={() => d.resolve(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="parchment gilded corners unfurl w-full max-w-sm rounded-sm px-6 pt-7 pb-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 蠟封 */}
        <div
          className={`mx-auto -mt-12 mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl shadow-lg ${
            d.danger
              ? "border-[#4a0f0f] bg-[radial-gradient(circle_at_35%_30%,#a83a3a,#5e1515_70%)] text-parchment"
              : "border-[#6d4a12] bg-[radial-gradient(circle_at_35%_30%,#e3c47a,#8a6524_75%)] text-ink"
          }`}
          aria-hidden
        >
          {icon}
        </div>

        <h2 id="dialog-title" className="text-lg font-bold tracking-wider">
          {d.title ?? (d.alertOnly ? "提醒" : "請再想一想")}
        </h2>
        <div className="divider mx-auto my-3 max-w-[10rem] text-[10px]">✦</div>
        <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">{d.message}</p>

        <div className="mt-6 flex justify-center gap-3">
          {!d.alertOnly && (
            <button
              className="btn-ghost min-w-24 rounded-sm px-4 py-2 text-sm"
              onClick={() => d.resolve(false)}
            >
              {d.cancelText ?? "再想想"}
            </button>
          )}
          <button
            autoFocus
            className={`${d.danger ? "btn-wax" : "btn-brass"} min-w-24 rounded-sm px-4 py-2 text-sm`}
            onClick={() => d.resolve(true)}
          >
            {d.confirmText ?? (d.alertOnly ? "知道了" : "確定")}
          </button>
        </div>
      </div>
    </div>
  );
}
