// functions/index.js
const { onRequest }  = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { getAllConceptos } = require("./contabiliumService");

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

  const stockMap = {};
  for (const c of conceptos) {
    const code = (c.Codigo || "").trim();
    if (code) stockMap[code] = Math.round(c.Stock || 0);
  }

  const snapshot = await db.collection("products").get();

  const updates = [];
  for (const docSnap of snapshot.docs) {
    const { sku, stock } = docSnap.data();
    const skuStr = (sku || "").toString().trim();
    if (!skuStr || !(skuStr in stockMap)) continue;
    const newStock = stockMap[skuStr];
    if (newStock !== stock) updates.push({ ref: docSnap.ref, stock: newStock });
  }

  for (let i = 0; i < updates.length; i += 499) {
    const batch = db.batch();
    for (const u of updates.slice(i, i + 499)) {
      batch.update(u.ref, {
        stock:     u.stock,
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
