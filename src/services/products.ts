import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy, limit, getDocs,
  where, startAfter, QueryDocumentSnapshot, DocumentData
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase"; // 👈 asegurate que exista src/firebase.ts|js con {db,storage}
import { authReady } from "../authReady";

export type Product = {
  id?: string;
  name: string;
  nameLower: string;
  price: number;
  stock: number;
  category: string;
  active: boolean;
  imageUrl: string;
  createdAt?: any; updatedAt?: any;
};

const colRef = collection(db, "products");
const normalize = (s: string) => (s || "").trim().toLowerCase();

export async function createProduct({
  name, price, stock, category, active, imageFile
}: {
  name: string; price?: number | string; stock?: number | string;
  category?: string; active?: boolean; imageFile?: File | null;
}) {
  const base = {
    name: name || "",
    nameLower: normalize(name),
    price: Number(price ?? 0),
    stock: Number(stock ?? 0),
    category: category || "general",
    active: active ?? true,
    imageUrl: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(colRef, base);

  if (imageFile) {
    const url = await uploadProductImage(docRef.id, imageFile);
    await updateDoc(docRef, { imageUrl: url, updatedAt: serverTimestamp() });
  }
  return { id: docRef.id, ...base } as Product;
}

export async function updateProduct(id: string, {
  name, price, stock, category, active, imageFile
}: {
  name?: string; price?: number | string; stock?: number | string;
  category?: string; active?: boolean; imageFile?: File | null;
}) {
  const patch: any = { updatedAt: serverTimestamp() };
  if (name !== undefined) { patch.name = name; patch.nameLower = normalize(name); }
  if (price !== undefined) patch.price = Number(price);
  if (stock !== undefined) patch.stock = Number(stock);
  if (category !== undefined) patch.category = category || "general";
  if (active !== undefined) patch.active = !!active;
  if (imageFile) { const url = await uploadProductImage(id, imageFile); patch.imageUrl = url; }
  await updateDoc(doc(db, "products", id), patch);
}

export async function deleteProductById(id: string) {
  await deleteDoc(doc(db, "products", id));
}

// Sube a Storage: products/{id}/{timestamp_nombre}
export async function uploadProductImage(productId: string, file: File) {
  // 1) Asegurar sesión activa (evita storage/unauthenticated)
  const user = await authReady();
  if (!user) {
    throw new Error("No hay sesión activa. Iniciá sesión y volvé a intentar.");
  }

  // 2) (Recomendado) refrescar token por si está expirado / reloj corrido
  await user.getIdToken(true);

  // 3) Validaciones básicas del archivo
  if (!/^image\//.test(file.type)) throw new Error("Solo se permiten imágenes");
  const maxMB = 10;
  if (file.size > maxMB * 1024 * 1024) throw new Error(`Imagen > ${maxMB}MB`);

  // 4) Subida con contentType y metadata útil
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const fileRef = ref(storage, `products/${productId}/${Date.now()}_${safeName}`);

  const snap = await uploadBytes(fileRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: { uploadedBy: user.uid },
  });

  return await getDownloadURL(snap.ref);
}
// Listado con búsqueda por prefijo, filtros y paginación simple
export async function listProducts({
  q = "", onlyActive = "all", category = "all", pageSize = 20,
  cursor = null as QueryDocumentSnapshot<DocumentData> | null
} = {}) {
  const nq = normalize(q);
  const clauses: any[] = [];
  if (nq) {
    clauses.push(where("nameLower", ">=", nq));
    clauses.push(where("nameLower", "<=", nq + "\uf8ff"));
  }
  if (onlyActive === "true") clauses.push(where("active", "==", true));
  if (category !== "all")    clauses.push(where("category", "==", category));

  const baseQ = query(colRef, ...clauses, orderBy("nameLower"), limit(pageSize));
  const pagedQ = cursor ? query(baseQ, startAfter(cursor)) : baseQ;

  const snap = await getDocs(pagedQ);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}
