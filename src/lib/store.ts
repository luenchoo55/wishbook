"use client";

import { useSyncExternalStore } from "react";
import { notify } from "@/lib/dialog";

export type Status = "cooling" | "want" | "got" | "letgo";

export interface Folder {
  id: string;
  name: string;
  color: string;
}

export interface Wish {
  id: string;
  name: string;
  price: number;
  folderId: string | null;
  status: Status;
  note: string;
  image?: string;
  createdAt: number;
  coolDays: number;
  statusAt: number;
}

export interface BookData {
  fund: number;
  folders: Folder[];
  wishes: Wish[];
}

export const STATUS_LABEL: Record<Status, string> = {
  cooling: "冷靜中",
  want: "還是想要",
  got: "已入手",
  letgo: "放下了",
};

export const FOLDER_COLORS = ["#7c2323", "#3e5b3a", "#2f4a6b", "#6b3f6e", "#a97c2a", "#5a3a22"];

export const DAY = 24 * 60 * 60 * 1000;

const KEY = "wishbook:v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function seed(): BookData {
  const now = Date.now();
  const home = { id: uid(), name: "居家小物", color: FOLDER_COLORS[4] };
  const wear = { id: uid(), name: "穿戴", color: FOLDER_COLORS[1] };
  const stationery = { id: uid(), name: "文具", color: FOLDER_COLORS[2] };
  return {
    fund: 0,
    folders: [home, wear, stationery],
    wishes: [
      {
        id: uid(),
        name: "（範例）黃銅小檯燈",
        price: 1680,
        folderId: home.id,
        status: "cooling",
        note: "範例：點開這張卡片可以編輯或刪除。寫下為什麼心動，冷靜期結束後再回來看看。",
        createdAt: now - 6 * DAY,
        coolDays: 30,
        statusAt: now - 6 * DAY,
      },
      {
        id: uid(),
        name: "（範例）手工皮革筆袋",
        price: 890,
        folderId: stationery.id,
        status: "letgo",
        note: "範例：畫完之後發現已經滿足了，就把它標成「放下了」，省下的錢會算進上方統計。",
        createdAt: now - 55 * DAY,
        coolDays: 7,
        statusAt: now - 40 * DAY,
      },
    ],
  };
}

let data: BookData | null = null;
const listeners = new Set<() => void>();

function load(): BookData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as BookData;
  } catch {}
  const fresh = seed();
  persist(fresh);
  return fresh;
}

function persist(d: BookData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    notify("畫冊存不下了（瀏覽器空間不足），試著刪掉幾張圖片吧。", { title: "書頁滿了" });
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      data = load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!data) data = load();
  return data;
}

export function useBook(): BookData | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function updateBook(fn: (d: BookData) => BookData) {
  data = fn(getSnapshot());
  persist(data);
  listeners.forEach((l) => l());
}

// 每分鐘更新一次的「現在」，用來算冷靜期
let now = 0;
const nowListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribeNow(cb: () => void) {
  nowListeners.add(cb);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      nowListeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    nowListeners.delete(cb);
    if (!nowListeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow() {
  return useSyncExternalStore(
    subscribeNow,
    () => (now ||= Date.now()),
    () => 0,
  );
}

export const money = (n: number) => `NT$ ${n.toLocaleString("zh-TW")}`;
