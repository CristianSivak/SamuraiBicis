import { useMemo, useState } from "react";
import { getOrderStatus } from "../../services/orders";
import { BusyButtonContent } from "../../components/ui/LoadingIndicators";

const statusLabels = {
  solicitud: "Solicitud recibida",
  pendiente: "En preparación",
  pagada: "Pedido completado",
  cancelada: "Pedido cancelado",
};

const statusStyles = {
  solicitud: "border-sky-200 bg-sky-50 text-sky-700",
  pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  pagada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelada: "border-rose-200 bg-rose-50 text-rose-700",
};

const paymentLabels = {
  transferencia: "Transferencia bancaria",
  cheque: "Cheque",
};

const baseSteps = [
  {
    id: "solicitud",
    title: "Solicitud recibida",
    description:
      "Registramos tu pedido y te enviamos un correo con los datos para que puedas seguirlo cuando quieras.",
  },
  {
    id: "pendiente",
    title: "Preparando tu pedido",
    description:
      "Nuestro equipo revisa el stock, coordina la logística y se comunica si surge alguna novedad.",
  },
  {
    id: "pagada",
    title: "Pedido completado",
    description:
      "Confirmamos el pago, cerramos el pedido y te compartimos la información de entrega o retiro.",
  },
];

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
  timeStyle: "short",
});

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateTimeFormatter.format(date);
}

function formatMoney(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return moneyFormatter.format(value);
}

function buildSteps(status) {
  const steps = baseSteps.map((step) => ({ ...step, state: "upcoming" }));
  if (status === "cancelada") {
    return steps
      .map((step, index) => {
        if (index === 0) return { ...step, state: "complete" };
        if (index === 1) return { ...step, state: "cancelled" };
        return step;
      })
      .concat({
        id: "cancelada",
        title: "Pedido cancelado",
        description:
          "Cancelamos el pedido. Si necesitás retomarlo o volver a generarlo, escribinos y te ayudamos al instante.",
        state: "cancelled",
      });
  }

  const currentIndex = Math.max(
    steps.findIndex((step) => step.id === status),
    0,
  );

  return steps.map((step, index) => {
    if (index < currentIndex) return { ...step, state: "complete" };
    if (index === currentIndex) return { ...step, state: "current" };
    return step;
  });
}

function StatusBadge({ status }) {
  const label = statusLabels[status] || status;
  const style = statusStyles[status] || "border-slate-200 bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${style}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

function StepIcon({ state, index }) {
  const base = "flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-semibold";
  if (state === "complete") {
    return (
      <span className={`${base} border-emerald-400 bg-emerald-50 text-emerald-600`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (state === "cancelled") {
    return (
      <span className={`${base} border-rose-400 bg-rose-50 text-rose-600`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 18 12-12M6 6l12 12" />
        </svg>
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={`${base} border-sky-400 bg-sky-50 text-sky-600`}>
        {index + 1}
      </span>
    );
  }
  return (
    <span className={`${base} border-slate-200 bg-white text-slate-400`}>
      {index + 1}
    </span>
  );
}

function StatusTimeline({ status }) {
  const steps = useMemo(() => buildSteps(status), [status]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_70px_-55px_rgba(15,23,42,0.45)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Seguimiento paso a paso</h3>
          <p className="mt-1 text-sm text-slate-500">
            Visualizá en qué instancia está tu pedido y qué acciones siguen a continuación.
          </p>
        </div>
      </div>
      <ol className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/40 p-4 text-sm text-slate-600 shadow-inner"
          >
            <StepIcon state={step.state} index={index} />
            <div>
              <p className="text-base font-semibold text-slate-900">{step.title}</p>
              <p className="mt-2 leading-relaxed text-slate-500">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ItemsTable({ items, total }) {
  if (!items?.length) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_70px_-55px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Detalle de artículos</h3>
        {typeof total === "number" && total > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            Total estimado: {formatMoney(total)}
          </div>
        ) : null}
      </div>
      <div className="mt-6 divide-y divide-slate-200 text-sm text-slate-600">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{item.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                Cantidad: {item.qty}
              </p>
            </div>
            <div className="text-right text-sm font-semibold text-slate-700">
              {item.price ? formatMoney(item.price * item.qty) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderSummary({ order }) {
  const lastUpdate = formatDate(order.updatedAt || order.createdAt);
  const createdAt = formatDate(order.createdAt);
  const paidAt = formatDate(order.paidAt);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_90px_-60px_rgba(15,23,42,0.45)]">
        <div className="absolute -right-28 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              Pedido #{order.id}
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Estado actualizado</h2>
              <p className="mt-2 text-sm text-slate-600">
                Última actualización {lastUpdate || "reciente"}. Te avisamos por correo cuando el estado cambie.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.28em] text-slate-400">Cliente</dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">
                  {order.customer?.name || "Sin nombre"}
                </dd>
                <dd className="text-xs text-slate-500">{order.customer?.email || "Sin correo registrado"}</dd>
                {order.customer?.phone ? (
                  <dd className="text-xs text-slate-500">Tel: {order.customer.phone}</dd>
                ) : null}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.28em] text-slate-400">Fechas clave</dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">
                  Creado: {createdAt || "—"}
                </dd>
                <dd className="text-xs text-slate-500">Última edición: {lastUpdate || "—"}</dd>
                {paidAt ? (
                  <dd className="text-xs text-emerald-600">Pago acreditado: {paidAt}</dd>
                ) : null}
              </div>
            </dl>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <StatusBadge status={order.status} />
            {order.paymentMethod ? (
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                Método de pago: <span className="font-semibold text-slate-900">{paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
              </div>
            ) : null}
            {typeof order.total === "number" && order.total > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/40">
                Total declarado: {formatMoney(order.total)}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <StatusTimeline status={order.status} />

      <ItemsTable items={order.items} total={order.total} />
    </div>
  );
}

export default function OrderStatusPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    const trimmedId = orderId.trim();
    const trimmedEmail = email.trim();

    if (!trimmedId) {
      setOrder(null);
      setError("Ingresá el número de pedido para continuar.");
      return;
    }

    setLoading(true);
    try {
      const result = await getOrderStatus(trimmedId, { email: trimmedEmail });
      setOrder(result);
    } catch (err) {
      console.error(err);
      setOrder(null);
      setError(err?.message || "No pudimos recuperar el estado del pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 pb-20 pt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-[0_45px_90px_-60px_rgba(15,23,42,0.45)]">
          <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />
          <div className="absolute -right-40 top-0 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              Seguimiento de pedidos
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900">Consultá el estado de tu pedido</h1>
              <p className="text-sm text-slate-600">
                Ingresá el código de pedido que recibiste por correo y, opcionalmente, tu email para validar la búsqueda. Te
                mostramos el avance en tiempo real y cada próxima acción.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_90px_-65px_rgba(15,23,42,0.45)]">
          <form className="space-y-6" onSubmit={onSubmit} aria-busy={loading}>
            <div className="grid gap-6 sm:grid-cols-[2fr_2fr_auto]">
              <div className="space-y-2">
                <label htmlFor="order-id" className="block text-sm font-medium text-slate-700">
                  Número de pedido
                </label>
                <input
                  id="order-id"
                  name="order-id"
                  autoComplete="off"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                  placeholder="Ej: ABC12345"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="order-email" className="block text-sm font-medium text-slate-700">
                  Correo asociado <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  id="order-email"
                  name="order-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                  placeholder="tuemail@empresa.com"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">
                  Solo lo utilizamos para confirmar que el pedido es tuyo. Si no lo recordás, podés dejar este campo vacío.
                </p>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-sky-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  <BusyButtonContent busy={loading} busyLabel="Buscando…" label="Consultar pedido" />
                </button>
              </div>
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                {error}
              </div>
            ) : null}
          </form>
        </section>

        {order ? (
          <div className="mt-12">
            <OrderSummary order={order} />
          </div>
        ) : null}

        {!order && submitted && !loading && !error ? (
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-[0_35px_70px_-55px_rgba(15,23,42,0.45)]">
            <h2 className="text-lg font-semibold text-slate-900">¿No ves tu pedido?</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Verificá que el código esté tal como lo recibiste (respetá guiones y mayúsculas si los tiene).</li>
              <li>Revisá la bandeja de spam: reenviamos el correo con el número de pedido automáticamente.</li>
              <li>Si necesitás ayuda inmediata, escribinos a <a className="text-sky-600 underline" href="mailto:ventas@samuraibicis.com">ventas@samuraibicis.com</a>.</li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
