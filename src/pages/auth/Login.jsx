// src/pages/auth/Login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, actionCodeSettings } from "../../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.assign("/admin");
    } catch (e) {
      console.error(e);
      setErr(humanizeAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    setErr(""); setMsg("");
    if (!email) { setErr("Ingresá tu email para enviarte el enlace."); return; }
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMsg("Te enviamos un email para restablecer/definir tu contraseña.");
    } catch (e) {
      console.error(e);
      setErr(humanizeAuthError(e));
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div>}

        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input type="email" className="w-full rounded-xl border px-3 py-2 text-sm"
                 value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Contraseña</label>
          <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm"
                 value={pass} onChange={e=>setPass(e.target.value)} required />
        </div>

        <div className="flex items-center justify-between">
          <button disabled={loading}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
          <button type="button" onClick={onForgot} className="text-sm text-gray-700 hover:text-gray-900">
            Olvidé mi contraseña
          </button>
        </div>
      </form>
    </div>
  );
}

function humanizeAuthError(e) {
  const code = e?.code || "";
  if (code.includes("auth/invalid-email")) return "Email inválido.";
  if (code.includes("auth/user-not-found")) return "No existe un usuario con ese email.";
  if (code.includes("auth/wrong-password")) return "Contraseña incorrecta.";
  if (code.includes("auth/too-many-requests")) return "Demasiados intentos, probá más tarde.";
  return "No pudimos iniciar sesión. Intentá de nuevo.";
}
