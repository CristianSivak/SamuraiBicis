// src/pages/auth/ResetPassword.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  verifyPasswordResetCode, confirmPasswordReset
} from "firebase/auth";
import { auth } from "../../firebase";

export default function ResetPassword() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (mode !== "resetPassword" || !oobCode) {
        setErr("Enlace inválido.");
        setLoading(false);
        return;
      }
      try {
        const mail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(mail);
      } catch {
        setErr("El enlace ya fue usado o expiró.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, oobCode]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (pass1.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres."); return; }
    if (pass1 !== pass2) { setErr("Las contraseñas no coinciden."); return; }
    try {
      await confirmPasswordReset(auth, oobCode, pass1);
      setMsg("¡Listo! Tu contraseña fue actualizada. Ya podés iniciar sesión.");
    } catch {
      setErr("No se pudo actualizar la contraseña. Pedí un nuevo enlace.");
    }
  }

  if (loading) return <div className="p-6">Verificando enlace…</div>;

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Definir contraseña</h1>
      {email && <p className="text-sm text-gray-600 mt-1">Para: <b>{email}</b></p>}
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div>}

        <div>
          <label className="mb-1 block text-sm">Nueva contraseña</label>
          <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm"
                 value={pass1} onChange={e=>setPass1(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Repetir contraseña</label>
          <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm"
                 value={pass2} onChange={e=>setPass2(e.target.value)} />
        </div>
        <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
          Guardar
        </button>
      </form>
    </div>
  );
}
