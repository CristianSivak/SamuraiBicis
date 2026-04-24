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
