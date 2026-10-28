"use client";

import { ask } from "@/lib/dialog";
import { DAY, Folder, money, Status, STATUS_LABEL, updateBook, Wish } from "@/lib/store";

const SEAL: Record<Status, string> = {
  cooling: "bg-night text-parchment",
  want: "bg-wine text-parchment",
  got: "bg-forest text-parchment",
  letgo: "bg-ink-soft/70 text-parchment",
};

const ICON: Record<Status, string> = {
  cooling: "⏳",
  want: "♥",
  got: "🗝",
  letgo: "🕊",
};

function setStatus(id: string, status: Status, fundDelta = 0) {
  updateBook((d) => ({
    ...d,
    fund: d.fund + fundDelta,
    wishes: d.wishes.map((w) => (w.id === id ? { ...w, status, statusAt: Date.now() } : w)),
  }));
}

export default function WishCard({
  wish,
  folder,
  fund,
  now,
  onEdit,
}: {
  wish: Wish;
  folder?: Folder;
  fund: number;
  now: number;
  onEdit: () => void;
}) {
  const day = Math.floor((now - wish.createdAt) / DAY) + 1;
  const left = Math.ceil((wish.createdAt + wish.coolDays * DAY - now) / DAY);
  const ripe = wish.status === "cooling" && left <= 0;
  const faded = wish.status === "letgo";

  const bringHome = async () => {
    if (fund >= wish.price) {
      const ok = await ask(`從心動基金取出 ${money(wish.price)}，\n帶「${wish.name}」回家？`, {
        title: "帶它回家",
        icon: "🗝",
        confirmText: "帶回家",
      });
      if (ok) setStatus(wish.id, "got", -wish.price);
    } else {
      const ok = await ask(
        `基金還差 ${money(wish.price - fund)}。\n仍要標記為已入手嗎？（不會扣基金）`,
        { title: "金幣不足", icon: "⚖", confirmText: "標記已入手" },
      );
      if (ok) setStatus(wish.id, "got");
    }
  };

  let timeline: string;
  if (wish.status === "cooling")
    timeline = ripe ? "冷靜期滿，再問自己一次" : `冷靜第 ${day} 天 · 還有 ${left} 天`;
  else timeline = `收進冊子 ${day} 天`;

  return (
    <article
      className={`parchment gilded corners unfurl flex flex-col rounded-sm transition hover:-translate-y-1 hover:shadow-2xl ${
        faded ? "opacity-70 grayscale-[0.4]" : ""
      } ${ripe ? "ring-2 ring-gold-light" : ""}`}
    >
      <button
        onClick={onEdit}
        className="m-3 mb-0 flex aspect-[4/3] items-center justify-center overflow-hidden border border-gold/50 bg-parchment-deep/40"
        aria-label={`編輯 ${wish.name}`}
      >
        {wish.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wish.image} alt={wish.name} className="sepia-img h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm text-ink-soft/70">
            <span className="text-2xl" aria-hidden>
              ✒
            </span>
            還沒畫
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <button onClick={onEdit} className="text-left">
          <h3
            className={`text-lg font-bold leading-snug ${faded ? "line-through decoration-ink-soft/50" : ""}`}
          >
            {wish.name}
          </h3>
        </button>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs shadow-inner ${SEAL[wish.status]}`}
          >
            <span aria-hidden>{ICON[wish.status]}</span>
            {STATUS_LABEL[wish.status]}
          </span>
          <span className="font-display text-sm font-bold text-wine">{money(wish.price)}</span>
        </div>

        {wish.note && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{wish.note}</p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2 border-t border-dashed border-gold/50 pt-2 text-xs text-ink-soft">
            <span className="flex items-center gap-1">
              {folder && (
                <span className="inline-block h-2 w-2 rotate-45" style={{ background: folder.color }} />
              )}
              {folder?.name ?? "未分類"}
            </span>
            <span className={ripe ? "font-bold text-wine" : ""}>{timeline}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {wish.status === "cooling" && (
              <>
                <button
                  className="btn-wax flex-1 rounded-sm px-2 py-1.5"
                  onClick={() => setStatus(wish.id, "want")}
                >
                  還是想要
                </button>
                <button
                  className="btn-ghost flex-1 rounded-sm px-2 py-1.5"
                  onClick={() => setStatus(wish.id, "letgo")}
                >
                  放下了
                </button>
              </>
            )}
            {wish.status === "want" && (
              <>
                <button className="btn-brass flex-1 rounded-sm px-2 py-1.5" onClick={bringHome}>
                  用基金帶回家
                </button>
                <button
                  className="btn-ghost flex-1 rounded-sm px-2 py-1.5"
                  onClick={() => setStatus(wish.id, "letgo")}
                >
                  放下了
                </button>
              </>
            )}
            {(wish.status === "got" || wish.status === "letgo") && (
              <button
                className="btn-ghost w-full rounded-sm px-2 py-1.5"
                onClick={() => setStatus(wish.id, "want")}
              >
                {wish.status === "letgo" ? "又想要了" : "退回「還是想要」"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
