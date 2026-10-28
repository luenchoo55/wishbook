"use client";

import { useState } from "react";
import { ask, notify } from "@/lib/dialog";
import { Folder, Status, STATUS_LABEL, uid, updateBook, Wish } from "@/lib/store";

const COOL_OPTIONS = [3, 7, 14, 30, 60];

// 把圖片縮小成 JPEG dataURL，避免塞爆 localStorage
function shrinkImage(file: File, max = 520): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function WishEditor({
  wish,
  folders,
  defaultFolderId,
  onClose,
}: {
  wish: Wish | null;
  folders: Folder[];
  defaultFolderId: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(wish?.name ?? "");
  const [price, setPrice] = useState(wish ? String(wish.price) : "");
  const [folderId, setFolderId] = useState(wish ? wish.folderId : defaultFolderId);
  const [coolDays, setCoolDays] = useState(wish?.coolDays ?? 7);
  const [status, setStatus] = useState<Status>(wish?.status ?? "cooling");
  const [note, setNote] = useState(wish?.note ?? "");
  const [image, setImage] = useState(wish?.image);

  const save = () => {
    if (!name.trim()) return notify("先替它取個名字吧。", { title: "還沒有名字" });
    const now = Date.now();
    const fields = {
      name: name.trim(),
      price: Number(price) || 0,
      folderId,
      coolDays,
      note: note.trim(),
      image,
    };
    updateBook((d) => ({
      ...d,
      wishes: wish
        ? d.wishes.map((w) =>
            w.id === wish.id
              ? { ...w, ...fields, status, statusAt: status === w.status ? w.statusAt : now }
              : w,
          )
        : [{ id: uid(), ...fields, status: "cooling", createdAt: now, statusAt: now }, ...d.wishes],
    }));
    onClose();
  };

  const remove = async () => {
    if (!wish) return;
    const ok = await ask(`把「${wish.name}」從冊子裡撕掉？\n撕掉的書頁就找不回來了。`, {
      title: "撕掉這頁",
      danger: true,
      confirmText: "撕掉",
    });
    if (!ok) return;
    updateBook((d) => ({ ...d, wishes: d.wishes.filter((w) => w.id !== wish.id) }));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="parchment gilded corners unfurl max-h-[92vh] w-full overflow-y-auto rounded-sm p-5 sm:max-w-lg sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-bold">
          {wish ? "修改這一頁" : "畫進冊子"}
          <span className="mt-1 block font-display text-xs font-normal tracking-[0.3em] text-ink-soft">
            {wish ? "AMEND THE PAGE" : "INSCRIBE A WISH"}
          </span>
        </h2>
        <div className="divider my-4 text-xs">✦</div>

        <label className="mx-auto mb-4 flex aspect-[4/3] w-full max-w-xs cursor-pointer items-center justify-center overflow-hidden border border-dashed border-gold bg-parchment-deep/40">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="預覽" className="sepia-img h-full w-full object-cover" />
          ) : (
            <span className="text-center text-sm text-ink-soft">
              <span className="block text-2xl">✒</span>
              點此放一張圖
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setImage(await shrinkImage(f));
            }}
          />
        </label>
        {image && (
          <button
            className="mx-auto -mt-2 mb-3 block text-xs text-ink-soft underline"
            onClick={() => setImage(undefined)}
          >
            移除圖片
          </button>
        )}

        <div className="grid gap-3 text-sm">
          <Field label="名稱">
            <input
              className="ink-input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：黃銅星盤"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="價格 (NT$)">
              <input
                className="ink-input w-full"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
              />
            </Field>
            <Field label="資料夾">
              <select
                className="ink-input w-full"
                value={folderId ?? ""}
                onChange={(e) => setFolderId(e.target.value || null)}
              >
                <option value="">未分類</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="冷靜期">
              <select
                className="ink-input w-full"
                value={coolDays}
                onChange={(e) => setCoolDays(Number(e.target.value))}
              >
                {[...new Set([...COOL_OPTIONS, coolDays])]
                  .sort((a, b) => a - b)
                  .map((d) => (
                    <option key={d} value={d}>
                      {d} 天
                    </option>
                  ))}
              </select>
            </Field>
            {wish && (
              <Field label="狀態">
                <select
                  className="ink-input w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                >
                  {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <Field label="為什麼心動">
            <textarea
              className="ink-input min-h-24 w-full"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="寫下它吸引你的地方，冷靜期過後再回來讀一次。"
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {wish && (
            <button className="text-sm text-wine underline-offset-4 hover:underline" onClick={remove}>
              撕掉這頁
            </button>
          )}
          <button className="btn-ghost ml-auto rounded-sm px-4 py-2 text-sm" onClick={onClose}>
            取消
          </button>
          <button className="btn-wax rounded-sm px-5 py-2 text-sm" onClick={save}>
            {wish ? "封存修改" : "畫進去"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs tracking-wider text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
