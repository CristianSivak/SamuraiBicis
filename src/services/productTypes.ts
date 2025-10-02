import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export type ProductType = {
  id?: string;
  title: string;
  identifier?: string | null;
};

const colRef = collection(db, "productTypes");

export function subscribeProductTypes(
  cb: (items: ProductType[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(colRef, orderBy("title", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        const title = typeof data?.title === "string" ? data.title : "";
        return {
          ...data,
          id: docSnap.id,
          identifier: data?.identifier ?? null,
          title,
        } as ProductType;
      });
      cb(items);
    },
    onError
  );
}
