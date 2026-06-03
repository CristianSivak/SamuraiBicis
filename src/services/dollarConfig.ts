import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export type DollarMode = "auto" | "manual" | "disabled";

export interface DollarConfig {
  mode: DollarMode;
  manualValue: number;
  lastAutoValue: number;
  lastAutoDate: string;
}

const DEFAULT_CONFIG: DollarConfig = {
  mode: "auto",
  manualValue: 0,
  lastAutoValue: 0,
  lastAutoDate: "",
};

const docRef = () => doc(db, "meta", "dollarConfig");

export async function getDollarConfig(): Promise<DollarConfig> {
  const snap = await getDoc(docRef());
  if (!snap.exists()) return { ...DEFAULT_CONFIG };
  return { ...DEFAULT_CONFIG, ...(snap.data() as Partial<DollarConfig>) };
}

export function subscribeDollarConfig(
  cb: (config: DollarConfig) => void
): () => void {
  return onSnapshot(docRef(), (snap) => {
    if (!snap.exists()) {
      cb({ ...DEFAULT_CONFIG });
    } else {
      cb({ ...DEFAULT_CONFIG, ...(snap.data() as Partial<DollarConfig>) });
    }
  });
}

export async function saveDollarConfig(
  partial: Partial<DollarConfig>
): Promise<void> {
  await setDoc(docRef(), partial, { merge: true });
}
