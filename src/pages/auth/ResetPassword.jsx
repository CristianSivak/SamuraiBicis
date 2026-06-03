// src/pages/auth/ResetPassword.jsx
import { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../../firebase";
import { BusyButtonContent, LoadingSpinner } from "../../components/ui/LoadingIndicators";

export default function ResetPassword() {
  const { search } = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState(null);

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

  // Countdown and redirect after success
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      history.push("/login");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, history]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (pass1.length < 6) {
      setErr("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pass1 !== pass2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    try {
      setSaving(true);
      await confirmPasswordReset(auth, oobCode, pass1);
      setMsg("¡Listo! Tu contraseña fue actualizada.");
      setPass1("");
      setPass2("");
      setCountdown(3);
    } catch {
      setErr("No se pudo actualizar la contraseña. Pedí un nuevo enlace.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Verificando enlace…" className="text-slate-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <section className="max-w-lg space-y-6 text-slate-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-indigo-500 shadow-sm">
            Seguridad reforzada
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Restablecé tu acceso en un par de pasos.
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Creamos un flujo guiado con estados claros y loaders visibles para que sepas cuándo tu nueva contraseña está lista.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            {["Token verificado", "Enlace seguro"].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_38px_-25px_rgba(15,23,42,0.15)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_35px_60px_-15px_rgba(15,23,42,0.18)] backdrop-blur">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Definir contraseña</h2>
            {email && (
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Para <span className="font-semibold text-slate-700">{email}</span>
              </p>
            )}
          </header>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} aria-busy={saving}>
            {err && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                <p className="font-medium">{msg} Ya podés iniciar sesión.</p>
                {countdown !== null && countdown > 0 && (
                  <p className="mt-1 text-xs text-emerald-500">
                    Redirigiendo al login en {countdown}s…
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Nueva contraseña</label>
              <input
                type="password"
                value={pass1}
                onChange={(e) => setPass1(e.target.value)}
                required
                disabled={!!msg}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Repetir contraseña</label>
              <input
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                required
                disabled={!!msg}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
              />
            </div>

            {!msg && (
              <button
                className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:opacity-60"
                disabled={saving}
              >
                <BusyButtonContent busy={saving} busyLabel="Guardando…" label="Guardar" />
              </button>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
