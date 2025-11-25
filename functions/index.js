// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
admin.initializeApp();

// región global (coincide con tu URL us-central1)
setGlobalOptions({ region: "us-central1" });

/**
 * Config de CORS: ajustá los orígenes permitidos.
 * IMPORTANTE: si usás credentials/cookies en el fetch, NO usar '*'
 */
const SITE_URL = "https://www.samurai.ar";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://bikeshop-ab2f0.web.app",
  "https://bikeshop-ab2f0.firebaseapp.com",
  `${SITE_URL.replace("https://", "http://")}`,
  SITE_URL,
]);

function setCorsHeaders(req, res) {
  const origin = req.get("Origin"); // ojo mayúscula
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Vary", "Origin"); // para caches intermedios/CDN
  }
  // Métodos y headers aceptados (incluí Authorization si lo usás)
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

exports.approveAndInviteUser = onRequest(
  // NOTA: desactivamos el cors automático y lo controlamos manualmente
  { cors: false },
  async (req, res) => {
    try {
      // CORS: siempre setear cabeceras
      setCorsHeaders(req, res);

      // Preflight
      if (req.method === "OPTIONS") {
        return res.status(204).send(""); // No Content
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

      // Crear/buscar en Auth
      let authUser;
      try {
        authUser = await admin.auth().getUserByEmail(email);
      } catch {
        authUser = await admin.auth().createUser({ email, displayName: name });
      }
      const uid = authUser.uid;

      // Doc final
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

      // Link de contraseña
      const link = await admin.auth().generatePasswordResetLink(email, {
        url: `${SITE_URL}/login`,
        handleCodeInApp: false,
      });

      return res.json({ uid, link });
    } catch (err) {
      console.error(err);
      // CORS también en errores
      setCorsHeaders(req, res);
      return res.status(500).json({ error: String(err) });
    }
  }
);
