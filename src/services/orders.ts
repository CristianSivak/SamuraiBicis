// src/services/orders.ts
import {
  collection, doc, getDocs, limit, orderBy, query,
  serverTimestamp, Timestamp, updateDoc, where, startAfter, QueryDocumentSnapshot, DocumentData, runTransaction
} from "firebase/firestore";
import { auth } from "../firebase";
import { db } from "../firebase";
import { authReady } from "../authReady";

export type OrderItem = { id: string; name: string; price: number; qty: number; };
export type Customer = { name: string; email?: string; phone?: string; notes?: string; };

const ORDERS = collection(db, "orders");

function sum(items: OrderItem[]) {
  return items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.qty || 0), 0);
}

export type PaymentMethod = "cheque" | "transferencia";

export async function createOrder({
  customer, items, paymentMethod
}: { customer: Customer; items: OrderItem[]; paymentMethod: PaymentMethod; }): Promise<string> {
  // Esperar resolución de sesión (puede ser null si huésped)
  const user = auth.currentUser ?? await authReady();

  const cleanItems = items.map(it => ({
    id: String(it.id),
    name: String(it.name || "").trim(),
    price: Number(it.price || 0),
    qty: Math.max(1, Math.min(999, Number(it.qty || 1)))
  })).filter(it => it.id && it.name && it.qty > 0);

  if (!cleanItems.length) throw new Error("Carrito vacío.");

  if (!paymentMethod || !["cheque", "transferencia"].includes(paymentMethod)) {
    throw new Error("Seleccioná un método de pago válido.");
  }

  const now = serverTimestamp();

  const payload: any = {
    status: user ? "pendiente" : "solicitud",
    currency: "ARS",
    createdAt: now,
    updatedAt: now,
    customer: {
      uid: user?.uid || null,
      name: String(customer.name || "").trim(),
      email: customer.email || null,
      phone: customer.phone || null,
      notes: customer.notes || null,
    },
    customerNameLower: String(customer.name || "").trim().toLowerCase(),
    items: cleanItems,
    // Si está logueado envío el total; huéspedes mandan 0 (las reglas lo exigen)
    total: user ? sum(cleanItems) : 0,
    paymentMethod,
  };

  const orderId = await runTransaction(db, async (tx) => {
    const orderRef = doc(ORDERS);

    for (const item of cleanItems) {
      const productRef = doc(db, "products", item.id);
      const snap = await tx.get(productRef);
      if (!snap.exists()) {
        throw new Error(`El producto "${item.name}" ya no está disponible.`);
      }
      const data = snap.data();
      const currentStock = Number(data?.stock ?? 0);
      if (currentStock < item.qty) {
        throw new Error(`No hay stock suficiente para "${item.name}".`);
      }
      tx.update(productRef, {
        stock: currentStock - item.qty,
        updatedAt: serverTimestamp(),
      });
    }

    tx.set(orderRef, payload);
    return orderRef.id;
  });

  return orderId;
}

export type ListOrdersParams = {
  status?: "all" | "pendiente" | "pagada" | "cancelada" | "solicitud";
  from?: Date | null;
  to?: Date | null;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
};
// Devuelve las más recientes; filtra por status y rango de fechas en el servidor.
// La búsqueda por texto (q) la hacemos cliente para simplicidad.
export async function listOrders(params: ListOrdersParams = {}) {
  const {
    status = "all",
    from = null,
    to = null,
    pageSize = 50,
    cursor = null
  } = params;

  const clauses: any[] = [];
  if (status !== "all") clauses.push(where("status", "==", status));
  if (from) clauses.push(where("createdAt", ">=", Timestamp.fromDate(from)));
  if (to)   clauses.push(where("createdAt", "<=", Timestamp.fromDate(to)));

  let q = query(ORDERS, ...clauses, orderBy("createdAt", "desc"), limit(pageSize));
  if (cursor) q = query(q, startAfter(cursor));

  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

export async function updateOrderStatus(orderId: string, newStatus: "pendiente" | "pagada" | "cancelada") {
  const patch: any = { status: newStatus, updatedAt: serverTimestamp() };
  if (newStatus === "pagada") patch.paidAt = serverTimestamp();
  await updateDoc(doc(db, "orders", orderId), patch);
}

