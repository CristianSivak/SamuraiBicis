import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export type CustomerType = {
  id?: string;
  title: string;
  discount: number;
  createdAt?: any;
  updatedAt?: any;
};

const col = collection(db, "customerTypes");

export function subscribeCustomerTypes(
  cb: (items: CustomerType[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(col, orderBy("title", "asc"));
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })) as CustomerType[]
      ),
    onError
  );
}

export async function createCustomerType(data: { title: string; discount: number }) {
  const payload = {
    title: data.title.trim(),
    discount: Number.isFinite(data.discount) ? Number(data.discount) : 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function updateCustomerType(id: string, patch: Partial<CustomerType>) {
  const payload: any = {
    ...patch,
    updatedAt: serverTimestamp(),
  };

  if (typeof payload.title === "string") {
    payload.title = payload.title.trim();
  }

  if (typeof payload.discount === "string") {
    payload.discount = Number(payload.discount);
  }

  await updateDoc(doc(db, "customerTypes", id), payload);
}

export async function removeCustomerType(id: string) {
  await deleteDoc(doc(db, "customerTypes", id));
}

