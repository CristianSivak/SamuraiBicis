// src/services/contabiliumDepositos.ts
// Mapeo cliente -> depósito de Contabilium. Vive en Firestore (no en el
// bundle del sitio) porque son nombres reales de distribuidores; el acceso
// de lectura está restringido a usuarios staff en firestore.rules.
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export type ContabiliumDeposito = { id: number; nombre: string };

let cache: ContabiliumDeposito[] | null = null;

export async function getContabiliumDepositos(): Promise<ContabiliumDeposito[]> {
  if (cache) return cache;
  const snap = await getDoc(doc(db, "internalData", "contabiliumDepositos"));
  const list = snap.exists() ? (snap.data().depositos as ContabiliumDeposito[]) : [];
  cache = list;
  return list;
}
