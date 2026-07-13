// functions/index.js
const { onRequest }  = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { getAllConceptos, getClientById, searchClientByDoc, getComprobantesByClientId, getComprobanteById, getStockByDeposito } = require("./contabiliumService");

admin.initializeApp();

// región global (coincide con tu URL us-central1)
setGlobalOptions({ region: "us-central1" });

const SITE_URL = "https://samurai.ar";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://bikeshop-ab2f0.web.app",
  "https://bikeshop-ab2f0.firebaseapp.com",
  `${SITE_URL.replace("https://", "http://")}`,
  SITE_URL,
  "http://www.samurai.ar",
  "https://www.samurai.ar",
]);

function setCorsHeaders(req, res) {
  const origin = req.get("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// Secretos del Secret Manager de Firebase
// Configurarlos con:
//   firebase functions:secrets:set CONTABILIUM_EMAIL
//   firebase functions:secrets:set CONTABILIUM_API_KEY
const CONTABILIUM_EMAIL   = defineSecret("CONTABILIUM_EMAIL");
const CONTABILIUM_API_KEY = defineSecret("CONTABILIUM_API_KEY");

// ─────────────────────────────────────────────────────────────
// Lógica compartida de sincronización Contabilium → Firestore
// ─────────────────────────────────────────────────────────────
async function doContabiliumSync(email, apiKey) {
  const db = admin.firestore();

  const conceptos = await getAllConceptos(email, apiKey);

  const conceptoMap = {};
  for (const c of conceptos) {
    const code = (c.Codigo || "").trim();
    if (code) conceptoMap[code] = {
      stock:    Math.round(c.Stock || 0),
      priceArs: c.PrecioFinal || null,
    };
  }

  const snapshot = await db.collection("products").get();

  const updates = [];
  for (const docSnap of snapshot.docs) {
    const { sku, stock, priceArs } = docSnap.data();
    const skuStr = (sku || "").toString().trim();
    if (!skuStr || !(skuStr in conceptoMap)) continue;
    const { stock: newStock, priceArs: newPriceArs } = conceptoMap[skuStr];
    const stockChanged    = newStock !== stock;
    const priceArsChanged = newPriceArs !== null && newPriceArs !== priceArs;
    if (stockChanged || priceArsChanged) {
      updates.push({ ref: docSnap.ref, stock: newStock, priceArs: newPriceArs });
    }
  }

  for (let i = 0; i < updates.length; i += 499) {
    const batch = db.batch();
    for (const u of updates.slice(i, i + 499)) {
      batch.update(u.ref, {
        stock:     u.stock,
        priceArs:  u.priceArs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  await db.doc("meta/contabiliumSync").set({
    lastSync: admin.firestore.FieldValue.serverTimestamp(),
    updated:  updates.length,
    total:    conceptos.length,
    errors:   [],
  });

  return { updated: updates.length, total: conceptos.length };
}

// ─────────────────────────────────────────────────────────────
// Sync automático cada 5 minutos
// ─────────────────────────────────────────────────────────────
exports.syncContabiliumStock = onSchedule(
  {
    schedule: "every 5 minutes",
    secrets:  [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY],
  },
  async () => {
    try {
      const result = await doContabiliumSync(
        CONTABILIUM_EMAIL.value(),
        CONTABILIUM_API_KEY.value()
      );
      console.log("[contabilium] sync ok:", result);
    } catch (err) {
      console.error("[contabilium] sync error:", err);
      await admin.firestore().doc("meta/contabiliumSync").set(
        { errors: [String(err)], lastSync: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Sync manual desde el panel de admin
// ─────────────────────────────────────────────────────────────
exports.triggerContabiliumSync = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST")    return res.status(405).json({ error: "Method Not Allowed" });

    try {
      const result = await doContabiliumSync(
        CONTABILIUM_EMAIL.value(),
        CONTABILIUM_API_KEY.value()
      );
      return res.json(result);
    } catch (err) {
      console.error("[contabilium] trigger error:", err);
      setCorsHeaders(req, res);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Vincula un usuario con su ficha de Contabilium y sincroniza IdListaPrecio
// ─────────────────────────────────────────────────────────────
exports.syncClientProfile = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST")    return res.status(405).json({ error: "Method Not Allowed" });

    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ error: "uid requerido" });

    try {
      const db      = admin.firestore();
      const userRef = db.doc(`users/${uid}`);
      const snap    = await userRef.get();
      if (!snap.exists) return res.status(404).json({ error: "Usuario no encontrado" });

      const userData       = snap.data();
      const contabiliumId  = userData.contabiliumId;
      const cuit           = userData.cuit;

      if (!contabiliumId && !cuit) {
        return res.status(400).json({ error: "El usuario no tiene contabiliumId ni CUIT asignado" });
      }

      const email  = CONTABILIUM_EMAIL.value();
      const apiKey = CONTABILIUM_API_KEY.value();

      let client = null;
      if (contabiliumId) {
        client = await getClientById(email, apiKey, contabiliumId);
      }
      if (!client && cuit) {
        client = await searchClientByDoc(email, apiKey, cuit);
      }

      if (!client) {
        return res.status(404).json({ error: "Cliente no encontrado en Contabilium" });
      }

      const patch = {
        contabiliumId:   client.Id,
        idListaPrecio:   client.IdListaPrecio ?? null,
        condicionIva:    client.CondicionIva  ?? null,
        contabiliumSync: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userRef.update(patch);

      return res.json({ ok: true, contabiliumId: client.Id, idListaPrecio: client.IdListaPrecio });
    } catch (err) {
      console.error("[contabilium] syncClientProfile error:", err);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Debug: devuelve los conceptos crudos de Contabilium (temporal)
// ─────────────────────────────────────────────────────────────
exports.debugContabiliumData = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const conceptos = await getAllConceptos(
        CONTABILIUM_EMAIL.value(),
        CONTABILIUM_API_KEY.value()
      );

      // También traemos los SKUs de Firestore para comparar
      const db = admin.firestore();
      const snapshot = await db.collection("products").get();
      const firestoreSkus = snapshot.docs.map((d) => ({
        id: d.id,
        sku: d.data().sku,
        name: d.data().name,
        stock: d.data().stock,
      }));

      const stockMap = {};
      for (const c of conceptos) {
        const code = (c.Codigo || "").trim();
        if (code) stockMap[code] = c.Stock;
      }

      const matches = firestoreSkus
        .filter((p) => p.sku && (p.sku.toString().trim() in stockMap))
        .map((p) => ({
          ...p,
          contabiliumStock: stockMap[p.sku.toString().trim()],
        }));

      return res.json({
        contabilium: {
          total: conceptos.length,
          sample: conceptos.slice(0, 10),
          codigosUnicos: [...new Set(conceptos.map((c) => c.Codigo).filter(Boolean))].slice(0, 30),
        },
        firestore: {
          total: firestoreSkus.length,
          skus: firestoreSkus.slice(0, 30),
        },
        matches,
      });
    } catch (err) {
      console.error("[contabilium] debug error:", err);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Devuelve los comprobantes (FCA, NCA, NDA) del cliente autenticado
// Requiere: Authorization: Bearer <Firebase ID token>
// ─────────────────────────────────────────────────────────────
exports.getClientComprobantes = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "No autorizado" });

    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return res.status(401).json({ error: "Token inválido" });
    }

    try {
      const db = admin.firestore();
      const userSnap = await db.doc(`users/${uid}`).get();
      if (!userSnap.exists) return res.status(404).json({ error: "Usuario no encontrado" });

      const { contabiliumId } = userSnap.data();
      if (!contabiliumId) return res.status(400).json({ error: "Usuario sin vinculación Contabilium" });

      const { tipos, desde, hasta } = req.body || {};

      const items = await getComprobantesByClientId(
        CONTABILIUM_EMAIL.value(),
        CONTABILIUM_API_KEY.value(),
        contabiliumId,
        { tipos, desde, hasta }
      );

      return res.json({ items, total: items.length });
    } catch (err) {
      console.error("[contabilium] getClientComprobantes error:", err);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Devuelve el detalle completo de un comprobante (para generar PDF)
// Requiere: Authorization: Bearer <Firebase ID token>
// El comprobante debe pertenecer al cliente autenticado
// ─────────────────────────────────────────────────────────────
exports.getComprobanteDetail = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "No autorizado" });

    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return res.status(401).json({ error: "Token inválido" });
    }

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id de comprobante requerido" });

    try {
      const db = admin.firestore();
      const userSnap = await db.doc(`users/${uid}`).get();
      if (!userSnap.exists) return res.status(404).json({ error: "Usuario no encontrado" });

      const { contabiliumId } = userSnap.data();
      if (!contabiliumId) return res.status(400).json({ error: "Usuario sin vinculación Contabilium" });

      const comprobante = await getComprobanteById(
        CONTABILIUM_EMAIL.value(),
        CONTABILIUM_API_KEY.value(),
        id
      );

      if (!comprobante) return res.status(404).json({ error: "Comprobante no encontrado" });

      // Verificamos que el comprobante pertenece al cliente que hace el pedido
      if (comprobante.IdCliente !== contabiliumId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      return res.json(comprobante);
    } catch (err) {
      console.error("[contabilium] getComprobanteDetail error:", err);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// ═════════════════════════════════════════════════════════════
// M5 — Notificación de pedidos
// Al crear una orden se genera una notificación para el admin con
// los datos del cliente ya listos para la carga manual en Contabilium
// (POST /comprobantes no está disponible en la API v1).
// ═════════════════════════════════════════════════════════════
exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const order   = snap.data() || {};
  const orderId = event.params.orderId;
  const db      = admin.firestore();

  try {
    const customer = order.customer || {};

    // Si el cliente está vinculado a Contabilium, adjuntamos los datos
    // necesarios para que el admin cargue el comprobante sin buscarlos.
    let contabilium = null;
    if (customer.uid) {
      const userSnap = await db.doc(`users/${customer.uid}`).get();
      if (userSnap.exists) {
        const u = userSnap.data() || {};
        contabilium = {
          contabiliumId: u.contabiliumId ?? null,
          idListaPrecio: u.idListaPrecio ?? null,
          condicionIva:  u.condicionIva  ?? null,
          cuit:          u.cuit ?? customer.cuit ?? null,
        };
      }
    }

    const items = Array.isArray(order.items)
      ? order.items.slice(0, 50).map((it) => ({
          id:    it.id ?? null,
          name:  it.name ?? "",
          qty:   Number(it.qty ?? 0),
          price: Number(it.price ?? 0),
        }))
      : [];

    await db.collection("notifications").add({
      type:          "order",
      orderId,
      orderStatus:   order.status || "pendiente",
      customerName:  customer.name  || "Cliente sin nombre",
      customerEmail: customer.email || null,
      customerPhone: customer.phone || null,
      customerCuit:  customer.cuit  || (contabilium && contabilium.cuit) || null,
      customerNotes: customer.notes || null,
      total:         Number(order.total ?? 0),
      itemsCount:    items.length,
      items,
      contabilium,
      read:          false,
      attended:      false,
      createdAt:     admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[notify] notificación creada para orden #${orderId}`);
  } catch (err) {
    console.error("[notify] onOrderCreated error:", err);
  }
});

// ═════════════════════════════════════════════════════════════
// M6 — Sincronización de estados (Pendiente → Facturado → Pagado)
// Cada 5 minutos cotejamos las órdenes abiertas contra los
// comprobantes (FCA) del cliente en Contabilium.
// ═════════════════════════════════════════════════════════════
const SYNC_STATUSES = ["pendiente", "facturado"];

function tsToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normNumero(value) {
  return String(value ?? "").replace(/\D/g, "");
}

// Estado de la orden a partir del saldo del comprobante vinculado
function statusFromComprobante(comprobante) {
  if (!comprobante) return null;
  return Number(comprobante.Saldo) <= 0 ? "pagada" : "facturado";
}

async function doOrderStatusSync(email, apiKey) {
  const db = admin.firestore();

  const ordersSnap = await db
    .collection("orders")
    .where("status", "in", SYNC_STATUSES)
    .limit(500)
    .get();

  // Agrupamos por cliente de Contabilium para pedir sus comprobantes una sola vez.
  // groups: contabiliumId -> { earliest: Date, orders: [{ ref, id, data }] }
  const groups = new Map();
  const userCache = new Map();

  for (const docSnap of ordersSnap.docs) {
    const data = docSnap.data() || {};
    const uid = data.customer && data.customer.uid;
    if (!uid) continue;

    let contabiliumId = null;
    if (userCache.has(uid)) {
      contabiliumId = userCache.get(uid);
    } else {
      const userSnap = await db.doc(`users/${uid}`).get();
      contabiliumId = userSnap.exists ? (userSnap.data().contabiliumId ?? null) : null;
      userCache.set(uid, contabiliumId);
    }
    if (!contabiliumId) continue;

    const createdAt = tsToDate(data.createdAt) || new Date();
    if (!groups.has(contabiliumId)) {
      groups.set(contabiliumId, { earliest: createdAt, orders: [] });
    }
    const group = groups.get(contabiliumId);
    if (createdAt < group.earliest) group.earliest = createdAt;
    group.orders.push({ ref: docSnap.ref, id: docSnap.id, data });
  }

  const updates = [];
  const errors = [];

  for (const [contabiliumId, group] of groups) {
    let comprobantes = [];
    try {
      // Pequeño margen hacia atrás por diferencias de huso/fecha de carga
      const desde = new Date(group.earliest);
      desde.setDate(desde.getDate() - 1);
      comprobantes = await getComprobantesByClientId(email, apiKey, contabiliumId, {
        tipos: ["FCA"],
        desde: desde.toISOString().slice(0, 10),
      });
    } catch (err) {
      errors.push(`cliente ${contabiliumId}: ${String(err)}`);
      continue;
    }

    const usados = new Set(); // evita vincular un mismo comprobante a dos órdenes

    for (const order of group.orders) {
      const data = order.data;
      let matched = null;

      // 1) Comprobante vinculado manualmente por número
      const linkedNumero = normNumero(data.contabiliumComprobanteNumero);
      if (linkedNumero) {
        matched = comprobantes.find((c) => normNumero(c.Numero) === linkedNumero) || null;
      }
      // 2) Comprobante vinculado por Id interno
      if (!matched && data.contabiliumComprobanteId) {
        matched = comprobantes.find((c) => c.Id === data.contabiliumComprobanteId) || null;
      }
      // 3) Auto-match por total + fecha (mejor esfuerzo)
      if (!matched) {
        const orderTotal = Number(data.total ?? 0);
        const orderDate  = tsToDate(data.createdAt);
        if (orderTotal > 0) {
          const tol = Math.max(1, orderTotal * 0.01);
          matched = comprobantes.find((c) => {
            if (usados.has(c.Id)) return false;
            if (Math.abs(Number(c.Total) - orderTotal) > tol) return false;
            if (orderDate && c.Fecha) {
              const cFecha = new Date(c.Fecha.includes("T") ? c.Fecha : c.Fecha + "T00:00:00");
              const grace  = new Date(orderDate);
              grace.setDate(grace.getDate() - 1);
              if (cFecha < grace) return false;
            }
            return true;
          }) || null;
        }
      }

      if (!matched) continue;
      usados.add(matched.Id);

      const newStatus = statusFromComprobante(matched);
      const patch = {};

      // Vinculación (si todavía no estaba registrada)
      if (data.contabiliumComprobanteId !== matched.Id) {
        patch.contabiliumComprobanteId = matched.Id;
        patch.contabiliumComprobanteNumero = matched.Numero || String(matched.Id);
      }

      if (newStatus && newStatus !== data.status) {
        patch.status = newStatus;
        if (newStatus === "facturado" && !data.facturadoAt) {
          patch.facturadoAt = admin.firestore.FieldValue.serverTimestamp();
        }
        if (newStatus === "pagada") {
          if (!data.facturadoAt) patch.facturadoAt = admin.firestore.FieldValue.serverTimestamp();
          patch.paidAt = admin.firestore.FieldValue.serverTimestamp();
        }
      }

      if (Object.keys(patch).length === 0) continue;
      patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.push({ ref: order.ref, patch });
    }
  }

  for (let i = 0; i < updates.length; i += 499) {
    const batch = db.batch();
    for (const u of updates.slice(i, i + 499)) batch.update(u.ref, u.patch);
    await batch.commit();
  }

  await db.doc("meta/orderStatusSync").set({
    lastSync: admin.firestore.FieldValue.serverTimestamp(),
    checked:  ordersSnap.size,
    updated:  updates.length,
    errors,
  });

  return { checked: ordersSnap.size, updated: updates.length, errors };
}

exports.syncOrderStatuses = onSchedule(
  {
    schedule: "every 5 minutes",
    secrets:  [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY],
  },
  async () => {
    try {
      const result = await doOrderStatusSync(
        CONTABILIUM_EMAIL.value(),
        CONTABILIUM_API_KEY.value()
      );
      console.log("[orders] sync ok:", result);
    } catch (err) {
      console.error("[orders] sync error:", err);
      await admin.firestore().doc("meta/orderStatusSync").set(
        { errors: [String(err)], lastSync: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }
);

exports.triggerOrderStatusSync = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST")    return res.status(405).json({ error: "Method Not Allowed" });

    try {
      const result = await doOrderStatusSync(
        CONTABILIUM_EMAIL.value(),
        CONTABILIUM_API_KEY.value()
      );
      return res.json(result);
    } catch (err) {
      console.error("[orders] trigger error:", err);
      setCorsHeaders(req, res);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// ─────────────────────────────────────────────────────────────
exports.approveAndInviteUser = onRequest(
  { cors: false },
  async (req, res) => {
    try {
      setCorsHeaders(req, res);

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      const { userDocId } = req.body || {};
      if (!userDocId) {
        return res.status(400).json({ error: "userDocId requerido" });
      }

      const tempRef = admin.firestore().doc(`users/${userDocId}`);
      const snap = await tempRef.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const u = snap.data();
      const email = String(u.email || u.emailLower || "").toLowerCase();
      const name = u.name || "";

      let authUser;
      try {
        authUser = await admin.auth().getUserByEmail(email);
      } catch {
        authUser = await admin.auth().createUser({ email, displayName: name });
      }
      const uid = authUser.uid;

      const finalRef = admin.firestore().doc(`users/${uid}`);
      await finalRef.set(
        {
          ...u,
          uid,
          approved: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (userDocId !== uid) await tempRef.delete();

      const link = await admin.auth().generatePasswordResetLink(email, {
        url: `${SITE_URL}/login`,
        handleCodeInApp: false,
      });

      return res.json({ uid, link });
    } catch (err) {
      console.error(err);
      setCorsHeaders(req, res);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// Arma la lista final de stock de un depósito: el nombre y precio salen
// catálogo de productos de Samurai (por sku). Solo se muestran productos
// que ya existen en el catálogo, con su nombre e imagen tal cual están ahí.
async function buildDepositoStockItems(db, email, apiKey, stockItems) {
  const stockMap = {};
  for (const item of stockItems) {
    const code = (item.Codigo || "").trim();
    if (code) stockMap[code] = {
      stockActual: Number(item.StockActual || 0),
      stockDisponible: Number(item.StockConReservas ?? item.StockActual ?? 0),
    };
  }

  const productsSnap = await db.collection("products").where("active", "==", true).get();
  const items = [];
  for (const docSnap of productsSnap.docs) {
    const p = docSnap.data();
    const skuStr = (p.sku || "").toString().trim();
    if (!skuStr || !(skuStr in stockMap)) continue;
    const { stockActual, stockDisponible } = stockMap[skuStr];
    if (stockActual <= 0 && stockDisponible <= 0) continue;
    items.push({
      id: docSnap.id,
      name: p.name || "",
      sku: skuStr,
      imageUrl: p.imageUrl || (p.images && p.images[0]) || "",
      stockActual,
      stockDisponible,
    });
  }
  return items;
}

// ─────────────────────────────────────────────────────────────
// M7 — Stock consignado por depósito
// Devuelve el stock real (Contabilium) del depósito asignado al
// cliente autenticado, cruzado con el catálogo de productos por SKU.
// Requiere: Authorization: Bearer <Firebase ID token>
// ─────────────────────────────────────────────────────────────
exports.getMyDepositoStock = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "No autorizado" });

    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return res.status(401).json({ error: "Token inválido" });
    }

    try {
      const db = admin.firestore();
      const userSnap = await db.doc(`users/${uid}`).get();
      if (!userSnap.exists) return res.status(404).json({ error: "Usuario no encontrado" });

      const { contabiliumDepositoId, contabiliumDepositoNombre } = userSnap.data();
      if (!contabiliumDepositoId) {
        return res.status(400).json({ error: "Usuario sin depósito consignado asignado" });
      }

      const email  = CONTABILIUM_EMAIL.value();
      const apiKey = CONTABILIUM_API_KEY.value();
      const stockItems = await getStockByDeposito(email, apiKey, contabiliumDepositoId);
      const items = await buildDepositoStockItems(db, email, apiKey, stockItems);

      return res.json({
        depositoId: contabiliumDepositoId,
        depositoNombre: contabiliumDepositoNombre || null,
        items,
      });
    } catch (err) {
      console.error("[contabilium] getMyDepositoStock error:", err);
      return res.status(500).json({ error: String(err) });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// M7b — Stock consignado por depósito, consultado por un admin
// (para ver el stock de cualquier cliente sin que él tenga que loguearse).
// Requiere: Authorization: Bearer <Firebase ID token> de un usuario staff.
// Body: { depositoId: number }
// ─────────────────────────────────────────────────────────────
exports.getDepositoStockAdmin = onRequest(
  { cors: false, secrets: [CONTABILIUM_EMAIL, CONTABILIUM_API_KEY] },
  async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "No autorizado" });

    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return res.status(401).json({ error: "Token inválido" });
    }

    try {
      const db = admin.firestore();
      const callerSnap = await db.doc(`users/${uid}`).get();
      const staffRoles = ["admin", "manager", "viewer"];
      if (!callerSnap.exists || !staffRoles.includes(callerSnap.data().role)) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const { depositoId } = req.body || {};
      if (!depositoId) return res.status(400).json({ error: "depositoId requerido" });

      const email  = CONTABILIUM_EMAIL.value();
      const apiKey = CONTABILIUM_API_KEY.value();
      const stockItems = await getStockByDeposito(email, apiKey, depositoId);
      const items = await buildDepositoStockItems(db, email, apiKey, stockItems);

      return res.json({ depositoId, items });
    } catch (err) {
      console.error("[contabilium] getDepositoStockAdmin error:", err);
      return res.status(500).json({ error: String(err) });
    }
  }
);
