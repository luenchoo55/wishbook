"use client";

import { useState } from "react";
import DialogHost from "@/components/DialogHost";
import FundPanel from "@/components/FundPanel";
import { ask } from "@/lib/dialog";
import WishCard from "@/components/WishCard";
import WishEditor from "@/components/WishEditor";
import {
  FOLDER_COLORS,
  money,
  Status,
  STATUS_LABEL,
  uid,
  updateBook,
  useBook,
  useNow,
  Wish,
} from "@/lib/store";

type StatusFilter = Status | "all";

export default function WishBook() {
  const book = useBook();
  const now = useNow();
  const [folderFilter, setFolderFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [newFolder, setNewFolder] = useState("");
  const [editing, setEditing] = useState<Wish | "new" | null>(null);

  if (!book) {
    return (
      <div className="parchment mx-auto max-w-5xl rounded-sm p-10 text-center text-ink-soft">
        翻開畫冊中…
      </div>
    );
  }

  const inFolder = book.wishes.filter(
    (w) => folderFilter === "all" || w.folderId === folderFilter,
  );
  const shown = inFolder.filter((w) => statusFilter === "all" || w.status === statusFilter);
  const count = (s: Status) => inFolder.filter((w) => w.status === s).length;

  const kept = book.wishes.filter((w) => w.status === "cooling" || w.status === "want").length;
  const letgo = book.wishes.filter((w) => w.status === "letgo");
  const saved = letgo.reduce((s, w) => s + w.price, 0);
  const got = book.wishes.filter((w) => w.status === "got").length;

  const addFolder = () => {
    const name = newFolder.trim();
    if (!name) return;
    updateBook((d) => ({
      ...d,
      folders: [
        ...d.folders,
        { id: uid(), name, color: FOLDER_COLORS[d.folders.length % FOLDER_COLORS.length] },
      ],
    }));
    setNewFolder("");
  };

  const removeFolder = async (id: string, name: string) => {
    const ok = await ask(`拆掉資料夾「${name}」？\n裡面的心願會移到「未分類」。`, {
      title: "拆掉資料夾",
      danger: true,
      confirmText: "拆掉",
    });
    if (!ok) return;
    updateBook((d) => ({
      ...d,
      folders: d.folders.filter((f) => f.id !== id),
      wishes: d.wishes.map((w) => (w.folderId === id ? { ...w, folderId: null } : w)),
    }));
    if (folderFilter === id) setFolderFilter("all");
  };

  const statusChips: StatusFilter[] = ["all", "cooling", "want", "got", "letgo"];

  return (
    <div className="parchment relative mx-auto max-w-5xl rounded-sm border-[6px] border-double border-gold/70 px-4 py-8 sm:px-10 sm:py-12">
      {/* 書脊縫線 */}
      <div className="pointer-events-none absolute inset-2 border border-dashed border-gold/30" />

      <header className="relative text-center">
        <p className="font-display text-xs tracking-[0.5em] text-ink-soft">✦ LIBER DESIDERIORUM ✦</p>
        <h1 className="gold-text mt-2 text-5xl font-bold tracking-[0.2em] sm:text-6xl">心願畫冊</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
          想要的東西，先畫下來、放進資料夾。
          <br />
          冷靜期過了還心動，再用心動基金帶它回家。
        </p>
        <div className="divider mx-auto mt-6 max-w-sm text-sm">❧</div>
      </header>

      <div className="relative mt-8 grid gap-6 lg:grid-cols-[28rem_1fr] lg:items-center">
        <FundPanel book={book} />
        <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-4 lg:pl-4">
          <Stat value={kept} label="件收在冊子裡" />
          <Stat value={letgo.length} label={`件放下了，省下 ${money(saved)}`} />
          <Stat value={got} label="件已入手" />
        </dl>
      </div>

      {/* 資料夾：書籤緞帶 */}
      <section className="relative mt-10">
        <h2 className="mb-2 text-xs tracking-[0.3em] text-ink-soft">資料夾</h2>
        <div className="flex flex-wrap items-end gap-1 border-b-2 border-gold/60">
          <FolderTab
            active={folderFilter === "all"}
            color="#3a2816"
            label="全部"
            count={book.wishes.length}
            onClick={() => setFolderFilter("all")}
          />
          {book.folders.map((f) => (
            <FolderTab
              key={f.id}
              active={folderFilter === f.id}
              color={f.color}
              label={f.name}
              count={book.wishes.filter((w) => w.folderId === f.id).length}
              onClick={() => setFolderFilter(f.id)}
              onRemove={() => removeFolder(f.id, f.name)}
            />
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="ink-input w-full min-w-0 text-sm"
            placeholder="新資料夾名稱"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFolder()}
          />
          <button className="btn-brass shrink-0 rounded-sm px-4 text-sm" onClick={addFolder}>
            新增
          </button>
        </div>
      </section>

      <section className="relative mt-6 flex flex-wrap items-center gap-2">
        {statusChips.map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? "border-ink bg-ink text-parchment shadow-md"
                  : "border-ink-soft/50 bg-parchment/40 text-ink-soft hover:border-gold hover:text-ink"
              }`}
            >
              {s === "all" ? "全部" : `${STATUS_LABEL[s]} ${count(s)}`}
            </button>
          );
        })}
        <button
          className="btn-wax ml-auto rounded-sm px-4 py-1.5 text-sm"
          onClick={() => setEditing("new")}
        >
          ＋ 畫進冊子
        </button>
      </section>

      <section className="relative mt-6 grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {shown.map((w) => (
          <WishCard
            key={w.id}
            wish={w}
            folder={book.folders.find((f) => f.id === w.folderId)}
            fund={book.fund}
            now={now}
            onEdit={() => setEditing(w)}
          />
        ))}
        {shown.length === 0 && (
          <p className="col-span-full py-12 text-center text-ink-soft">
            這一頁還是空白的。<br />
            <button className="mt-2 underline underline-offset-4" onClick={() => setEditing("new")}>
              畫下第一個心願
            </button>
          </p>
        )}
      </section>

      <footer className="relative mt-12 text-center text-xs text-ink-soft/70">
        <div className="divider mx-auto mb-3 max-w-xs">✦</div>
        畫冊只存在這台裝置的瀏覽器裡
      </footer>

      {editing && (
        <WishEditor
          key={editing === "new" ? "new" : editing.id}
          wish={editing === "new" ? null : editing}
          folders={book.folders}
          defaultFolderId={folderFilter === "all" ? null : folderFilter}
          onClose={() => setEditing(null)}
        />
      )}
      <DialogHost />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 border-l-2 border-gold/60 pl-3 lg:flex lg:items-baseline lg:gap-2">
      <dt className="font-display text-2xl font-bold text-wine">{value}</dt>
      <dd className="text-xs leading-snug break-words text-ink-soft lg:text-sm">{label}</dd>
    </div>
  );
}

function FolderTab({
  active,
  color,
  label,
  count,
  onClick,
  onRemove,
}: {
  active: boolean;
  color: string;
  label: string;
  count: number;
  onClick: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`group relative flex items-center rounded-t-md border border-b-0 transition ${
        active
          ? "-mb-0.5 border-gold bg-parchment pb-0.5"
          : "border-gold/40 bg-parchment-deep/60 hover:bg-parchment"
      }`}
      style={{ borderTop: `4px solid ${color}` }}
    >
      <button onClick={onClick} className={`px-3 py-1.5 text-sm ${active ? "font-bold" : ""}`}>
        {label} <span className="font-display text-xs text-ink-soft">{count}</span>
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          className="pr-2 text-xs text-ink-soft/60 hover:text-wine"
          aria-label={`刪除資料夾 ${label}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
