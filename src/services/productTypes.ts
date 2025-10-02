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

export type ProductType = {
  id?: string;
  title: string;
  createdAt?: any;
  updatedAt?: any;
};

const col = collection(db, "productTypes");

export function subscribeProductTypes(
  cb: (items: ProductType[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(col, orderBy("title", "asc"));
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })) as ProductType[]
      ),
    onError
  );
}

export async function createProductType(data: { title: string }) {
  const payload = {
    title: data.title.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function updateProductType(id: string, patch: Partial<ProductType>) {
  const payload: any = {
    ...patch,
    updatedAt: serverTimestamp(),
  };

  if (typeof payload.title === "string") {
    payload.title = payload.title.trim();
  }

  await updateDoc(doc(db, "productTypes", id), payload);
}

export async function removeProductType(id: string) {
  await deleteDoc(doc(db, "productTypes", id));
}
