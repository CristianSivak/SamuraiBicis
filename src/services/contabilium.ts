import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const TRIGGER_URL =
  "https://triggercontabiliumsync-p67y76y7mq-uc.a.run.app";

export interface SyncStatus {
  lastSync: Date | null;
  updated:  number;
  total:    number;
  errors:   string[];
}

export function subscribeToSyncStatus(
  onData:  (status: SyncStatus | null) => void,
  onError: (err: Error) => void = console.error
): () => void {
  return onSnapshot(
    doc(db, "meta", "contabiliumSync"),
    (snap) => {
      if (!snap.exists()) return onData(null);
      const d = snap.data();
      onData({
        lastSync: d.lastSync?.toDate?.() ?? null,
        updated:  d.updated  ?? 0,
        total:    d.total    ?? 0,
        errors:   d.errors   ?? [],
      });
    },
    (err) => {
      onError(err);
      onData(null);
    }
  );
}

export async function triggerSync(): Promise<{ updated: number; total: number }> {
  const res = await fetch(TRIGGER_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sync failed ${res.status}: ${text}`);
  }
  return res.json();
}

// ── M6 — Sincronización de estados de órdenes ──────────────────
const ORDER_SYNC_TRIGGER_URL =
  "https://us-central1-bikeshop-ab2f0.cloudfunctions.net/triggerOrderStatusSync";

export interface OrderSyncStatus {
  lastSync: Date | null;
  checked:  number;
  updated:  number;
  errors:   string[];
}

export function subscribeToOrderSyncStatus(
  onData:  (status: OrderSyncStatus | null) => void,
  onError: (err: Error) => void = console.error
): () => void {
  return onSnapshot(
    doc(db, "meta", "orderStatusSync"),
    (snap) => {
      if (!snap.exists()) return onData(null);
      const d = snap.data();
      onData({
        lastSync: d.lastSync?.toDate?.() ?? null,
        checked:  d.checked  ?? 0,
        updated:  d.updated  ?? 0,
        errors:   d.errors   ?? [],
      });
    },
    (err) => {
      onError(err);
      onData(null);
    }
  );
}

export async function triggerOrderStatusSync(): Promise<{
  checked: number;
  updated: number;
  errors: string[];
}> {
  const res = await fetch(ORDER_SYNC_TRIGGER_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Order sync failed ${res.status}: ${text}`);
  }
  return res.json();
}
