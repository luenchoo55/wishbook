"use client";

import { useSyncExternalStore } from "react";

export interface DialogOptions {
  title?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface DialogState extends DialogOptions {
  message: string;
  alertOnly: boolean;
  resolve: (ok: boolean) => void;
}

let current: DialogState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function open(message: string, alertOnly: boolean, opts: DialogOptions) {
  // 若已有彈窗開著，先當成取消
  current?.resolve(false);
  return new Promise<boolean>((resolve) => {
    current = {
      ...opts,
      message,
      alertOnly,
      resolve: (ok) => {
        current = null;
        emit();
        resolve(ok);
      },
    };
    emit();
  });
}

/** 取代 confirm()：回傳使用者是否按下確定 */
export const ask = (message: string, opts: DialogOptions = {}) => open(message, false, opts);

/** 取代 alert() */
export const notify = (message: string, opts: DialogOptions = {}) =>
  open(message, true, opts).then(() => undefined);

export function useDialog() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
}
