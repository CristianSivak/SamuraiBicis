import React, { useState } from "react";
import { createClientLead } from "../../services/accounts";

export default function QuieroSerClienteForm({
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    celular: "",
    email: "",
    empresa: "",
    cuit: "",
    provincia: "",
    localidad: "",
    rubro: "",
    mensaje: "",
    acepta: false,
  });

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // Validación rápida
    if (!form.acepta) {
      setError("Debés aceptar la política de privacidad para continuar.");
      return;
    }

    setLoading(true);
    try {
      const id = await createClientLead(form);
      console.log("Solicitud creada:", id);
      setOk(true);
      onSuccess?.();

      // Reseteo
      setForm({
        nombre: "", celular: "", email: "", empresa: "", cuit: "",
        provincia: "", localidad: "", rubro: "", mensaje: "", acepta: false,
      });
    } catch (err) {
      console.error(err);
      setError("No pudimos enviar el formulario. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
        <h3 className="text-lg font-semibold">¡Gracias! 🎉</h3>
        <p className="mt-1 text-sm">
          Recibimos tu solicitud. Nuestro equipo comercial te va a contactar a la brevedad.
        </p>
        <button
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setOk(false)}
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 sm:p-8">
      {/* título con subrayado */}
      <h2 className="mb-6 inline-block border-b-2 border-gray-300 pb-1 text-xl font-semibold text-gray-900">
        Quiero ser cliente
      </h2>

      <form onSubmit={onSubmit} className="space-y-6 pr-2 sm:pr-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Tu Nombre y Apellido <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            required
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Celular */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Celular <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="celular"
            value={form.celular}
            onChange={onChange}
            required
            inputMode="numeric"
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Con código de área, sin el 0 y sin el 15. Ej: 3624-4568923.
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Correo electrónico <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Empresa / CUIT */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Empresa
            </label>
            <input
              type="text"
              name="empresa"
              value={form.empresa}
              onChange={onChange}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              CUIT
            </label>
            <input
              type="text"
              name="cuit"
              value={form.cuit}
              onChange={onChange}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Provincia / Localidad */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Provincia
            </label>
            <input
              type="text"
              name="provincia"
              value={form.provincia}
              onChange={onChange}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Localidad
            </label>
            <input
              type="text"
              name="localidad"
              value={form.localidad}
              onChange={onChange}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Rubro */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Rubro
          </label>
          <select
            name="rubro"
            value={form.rubro}
            onChange={onChange}
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Seleccioná una opción</option>
            <option value="tienda">Tienda de bicis</option>
            <option value="taller">Taller</option>
            <option value="distribuidor">Distribuidor</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Mensaje */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Mensaje
          </label>
          <textarea
            name="mensaje"
            value={form.mensaje}
            onChange={onChange}
            rows={4}
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Checkbox */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="acepta"
            name="acepta"
            checked={form.acepta}
            onChange={onChange}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <label htmlFor="acepta" className="text-sm text-gray-700">
            Acepto la política de privacidad y el tratamiento de mis datos.
          </label>
        </div>

        {/* Botón */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </div>
  );
}
