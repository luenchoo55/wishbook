"use client";

import { useState } from "react";
import { notify } from "@/lib/dialog";
import { BookData, money, updateBook } from "@/lib/store";

export default function FundPanel({ book }: { book: BookData }) {
  const [amount, setAmount] = useState("");
  const wants = book.wishes.filter((w) => w.status === "want").sort((a, b) => a.price - b.price);
  const total = wants.reduce((s, w) => s + w.price, 0);
  const affordable = wants.filter((w) => w.price <= book.fund).length;
  const next = wants.find((w) => w.price > book.fund);

  const change = (sign: 1 | -1) => {
    const n = Math.floor(Number(amount));
    if (!n || n < 0) return;
    if (sign < 0 && n > book.fund) {
      notify(`金庫裡只有 ${money(book.fund)}，沒有那麼多金幣喔。`, { title: "金幣不足", icon: "⚖" });
      return;
    }
    updateBook((d) => ({ ...d, fund: d.fund + sign * n }));
    setAmount("");
  };

  return (
    <section className="parchment gilded corners rounded-sm p-5">
      <div className="flex items-center gap-2 text-sm tracking-widest text-ink-soft">
        <span aria-hidden>⚜</span> 心動基金 <span className="font-display text-xs">· Treasury</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-sm text-ink-soft">NT$</span>
        <span className="gold-text font-display text-4xl font-bold">
          {book.fund.toLocaleString("zh-TW")}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="ink-input w-full min-w-0 text-sm"
          inputMode="numeric"
          placeholder="金額"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && change(1)}
        />
        <button className="btn-brass shrink-0 rounded-sm px-3 text-sm" onClick={() => change(1)}>
          存入
        </button>
        <button className="btn-ghost shrink-0 rounded-sm px-3 text-sm" onClick={() => change(-1)}>
          取出
        </button>
      </div>

      <div className="mt-4 border-t border-gold/40 pt-3 text-sm leading-relaxed text-ink-soft">
        {wants.length === 0 ? (
          <p>還沒有「還是想要」的東西，基金先慢慢存著。</p>
        ) : (
          <>
            <p>
              還是想要 <b className="text-ink">{wants.length}</b> 件，共{" "}
              <b className="text-ink">{money(total)}</b>；基金足夠帶回{" "}
              <b className="text-wine">{affordable}</b> 件。
            </p>
            {next && (
              <div className="mt-2">
                <div className="flex justify-between text-xs">
                  <span className="truncate">下一件：{next.name}</span>
                  <span className="shrink-0 pl-2">
                    還差 {money(next.price - book.fund)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full border border-gold/60 bg-parchment-deep/60">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light"
                    style={{ width: `${Math.min(100, (book.fund / next.price) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
