// src/pages/catalog/CatalogPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listProducts } from "../../services/products";
import { createOrder } from "../../services/orders";
import { LoadingOverlay, BusyButtonContent } from "../../components/ui/LoadingIndicators";

const money = (n) =>
  Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

const SORTS = [
  { id: "featured", label: "Destacado" },
  { id: "newest", label: "Llegadas más recientes" },
  { id: "name", label: "Nombre (A-Z)" },
  { id: "priceAsc", label: "Precio - bajo a alto" },
  { id: "priceDesc", label: "Precio - alto a bajo" },
];

export default function CatalogPage({ isLoggedIn = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const response = await listProducts({
          onlyActive: "true",
          category: "all",
          q: "",
          pageSize: 200,
        });
        if (!active) return;
        setItems(response.items);
        setInitialLoaded(true);
      } catch (e) {
        console.error("Error listando productos:", e?.code, e?.message);
        alert("No se pudieron cargar los productos.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCart((prev) => {
      let changed = false;
      const next = [];
      for (const item of prev) {
        const product = items.find((p) => p.id === item.id);
        const stock = Number(product?.stock ?? 0);
        if (!product || stock <= 0) {
          changed = true;
          continue;
        }
        const clampedQty = Math.min(item.qty, stock);
        if (clampedQty !== item.qty) {
          changed = true;
          next.push({ ...item, qty: clampedQty });
        } else {
          next.push(item);
        }
      }
      if (!changed && next.length === prev.length) return prev;
      return next;
    });
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category || "general"));
    return Array.from(set)
      .sort()
      .map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }));
  }, [items]);

  const toggleCategory = (id) =>
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const clearFilters = () => {
    setSelectedCats([]);
    setSearch("");
  };

  const filtered = useMemo(() => {
    let list = items;
    if (selectedCats.length)
      list = list.filter((p) => selectedCats.includes(p.category || "general"));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "name":
        list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "newest":
        list = [...list].sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        break;
      case "priceAsc":
        list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceDesc":
        list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        break;
    }
    return list;
  }, [items, selectedCats, search, sort]);

  const addToCart = (p) => {
    const availableStock = Number(p?.stock ?? 0);
    if (availableStock <= 0) {
      alert("No hay stock disponible para este producto.");
      return;
    }
    setCartOpen(true);
    setCart((prev) => {
      const existing = prev.find((x) => x.id === p.id);
      if (existing) {
        if (existing.qty >= availableStock) {
          alert("Alcanzaste el stock disponible de este producto.");
          return prev;
        }
        return prev.map((x) =>
          x.id === p.id
            ? { ...x, qty: Math.min(availableStock, x.qty + 1) }
            : x
        );
      }
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          price: Number(p.price || 0),
          imageUrl: p.imageUrl || "",
          qty: 1,
        },
      ];
    });
  };

  const setQty = (id, qty) =>
    setCart((prev) => {
      const product = items.find((p) => p.id === id);
      const maxQty = Number(product?.stock ?? 0);
      if (!product || maxQty <= 0) {
        return prev.filter((x) => x.id !== id);
      }
      const nextQty = Math.max(1, Math.min(maxQty, Number(qty || 1)));
      return prev.map((x) => (x.id === id ? { ...x, qty: nextQty } : x));
    });

  const removeFromCart = (id) => setCart((prev) => prev.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);

  const cartTotal = useMemo(
    () => cart.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0),
    [cart]
  );

  async function submitOrder(data) {
    const { paymentMethod, ...customer } = data;
    setOrderResult(null);

    if (!cart.length) {
      setOrderResult({ ok: false, error: "Tu carrito está vacío." });
      return;
    }

    if (!paymentMethod) {
      setOrderResult({ ok: false, error: "Seleccioná un método de pago." });
      return;
    }

    const orderItems = cart.map(({ id, name, price, qty }) => ({ id, name, price, qty }));
    const shortages = orderItems.filter((item) => {
      const product = items.find((p) => p.id === item.id);
      const available = Number(product?.stock ?? 0);
      return !product || available < item.qty;
    });

    if (shortages.length) {
      const names = shortages.map((it) => it.name).join(", ");
      setOrderResult({
        ok: false,
        error: `No hay stock suficiente para: ${names}. Actualizá las cantidades antes de continuar.`,
      });
      return;
    }

    try {
      setOrderSubmitting(true);
      const orderId = await createOrder({
        customer,
        items: orderItems,
        paymentMethod,
      });
      setOrderResult({ ok: true, orderId });
      setItems((prev) =>
        prev.map((product) => {
          const match = orderItems.find((it) => it.id === product.id);
          if (!match) return product;
          const currentStock = Number(product?.stock ?? 0);
          const nextStock = Math.max(0, currentStock - match.qty);
          return { ...product, stock: nextStock };
        })
      );
      clearCart();
    } catch (e) {
      console.error(e);
      setOrderResult({ ok: false, error: e?.message || "Error al crear el pedido" });
    } finally {
      setOrderSubmitting(false);
    }
  }

  const showSkeleton = loading && !initialLoaded;
  const showOverlay = loading && initialLoaded;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.22),_transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-500 via-purple-500 to-slate-500" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-sky-100">
                Catálogo actualizado
              </div>
              <div>
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                  Descubrí todo el portfolio Samurai con métricas en vivo.
                </h1>
                <p className="mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
                  Filtrá por categoría, ordená en segundos y detectá la disponibilidad al instante. Cada interacción tiene loaders claros para que la experiencia sea más fluida.
                </p>
              </div>
              <dl className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Stock activo", value: `${items.length}` },
                  { label: "Categorías", value: categories.length || "–" },
                  { label: "Total en carrito", value: money(cartTotal) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-800/60 bg-slate-900/50 px-4 py-4 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]"
                  >
                    <dt className="text-xs uppercase tracking-wide text-slate-400">{item.label}</dt>
                    <dd className="mt-2 text-xl font-semibold text-white">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-[0_40px_70px_-35px_rgba(15,23,42,0.8)]">
              <div className="absolute -right-20 top-1/2 h-60 w-60 -translate-y-1/2 rounded-full bg-sky-500/30 blur-3xl" />
              <div className="relative space-y-6">
                <h2 className="text-lg font-semibold text-white">Carrito inteligente</h2>
                <p className="text-sm text-slate-300">
                  Guardamos tu selección mientras navegás y te avisamos si el stock cambia. Abrilo para ver detalles y finalizar tu pedido.
                </p>
                <button
                  onClick={() => setCartOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:translate-y-[-1px]"
                >
                  Abrir carrito ({cart.length})
                </button>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
                  {isLoggedIn ? (
                    <p>Los precios incluyen tu lista mayorista. Podés enviar el pedido directo al panel.</p>
                  ) : (
                    <p>Si todavía no iniciaste sesión, igual podés enviar tu carrito como solicitud con seguimiento.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <FiltersSidebar
              categories={categories}
              selected={selectedCats}
              onToggle={toggleCategory}
              onClear={clearFilters}
              loading={showSkeleton}
            />
          </aside>

          <section className="space-y-6 lg:col-span-9">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center gap-3 sm:max-w-sm">
                <button
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm transition hover:bg-slate-900/80 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  Filtros
                </button>
                <div className="flex-1">
                  <label className="sr-only">Buscar</label>
                  <input
                    type="search"
                    placeholder="Buscar por producto o marca"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              </div>

              <SortBar sort={sort} setSort={setSort} />
            </div>

            <ActiveFilters
              categories={categories}
              selected={selectedCats}
              onRemove={(id) => toggleCategory(id)}
              onClear={clearFilters}
            />

            <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-[0_50px_80px_-45px_rgba(15,23,42,0.9)]">
              {showOverlay && (
                <LoadingOverlay
                  label="Actualizando catálogo…"
                  className="rounded-[inherit] border border-slate-800/70 bg-slate-950/80 text-slate-200"
                  labelClassName="text-slate-200"
                />
              )}
              {showSkeleton ? (
                <ProductGridSkeleton />
              ) : (
                <ProductGrid items={filtered} isLoggedIn={isLoggedIn} onAdd={addToCart} />
              )}
            </div>
          </section>
        </div>
      </div>

      <FiltersDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
        selected={selectedCats}
        onToggle={toggleCategory}
        onClear={clearFilters}
        loading={showSkeleton}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setQty={setQty}
        removeItem={removeFromCart}
        total={cartTotal}
        isLoggedIn={isLoggedIn}
        onCheckout={() => {
          const hasIssues = cart.some((item) => {
            const product = items.find((p) => p.id === item.id);
            const available = Number(product?.stock ?? 0);
            return !product || available < item.qty;
          });
          if (hasIssues) {
            alert("Actualizá las cantidades: no hay stock suficiente para continuar.");
            return;
          }
          setCartOpen(false);
          setOrderOpen(true);
          setOrderResult(null);
        }}
        products={items}
      />

      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        submitting={orderSubmitting}
        result={orderResult}
        onSubmit={submitOrder}
      />
    </main>
  );
}

function FiltersSidebar({ categories, selected, onToggle, onClear, loading }) {
  return (
    <div className="sticky top-24 space-y-4">
      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-[0_40px_70px_-45px_rgba(15,23,42,0.9)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Categorías</h3>
          <button onClick={onClear} className="text-xs text-slate-400 transition hover:text-slate-200">
            Borrar filtros
          </button>
        </div>
        {loading ? (
          <ul className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="h-4 w-4 rounded border border-slate-700 bg-slate-800 animate-pulse" />
                <span className="h-3 w-24 rounded bg-slate-800/60 animate-pulse" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <input
                  id={`cat-${c.id}`}
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => onToggle(c.id)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-400 focus:ring-sky-500"
                />
                <label htmlFor={`cat-${c.id}`} className="cursor-pointer text-sm text-slate-200">
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/50 px-5 py-4 text-xs text-slate-300 shadow-[0_30px_50px_-40px_rgba(15,23,42,0.9)]">
        <p className="font-semibold text-slate-100">Tip:</p>
        <p className="mt-1 leading-relaxed">
          Combiná filtros y ordenamientos. Las cargas ahora muestran overlays para que sepas cuándo se actualiza el listado.
        </p>
      </div>
    </div>
  );
}

function FiltersDrawer({ open, onClose, categories, selected, onToggle, onClear, loading }) {
  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl transition-transform ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Filtrar</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-900">
            Cerrar
          </button>
        </div>
        <div className="mt-4">
          <FiltersSidebar
            categories={categories}
            selected={selected}
            onToggle={onToggle}
            onClear={onClear}
            loading={loading}
          />
        </div>
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/40"
          >
            Ver resultados
          </button>
        </div>
      </aside>
    </div>
  );
}

function SortBar({ sort, setSort }) {
  return (
    <div className="shrink-0">
      <label className="sr-only">Ordenar</label>
      <select
        className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id} className="text-slate-900">
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActiveFilters({ categories, selected, onRemove, onClear }) {
  if (!selected.length) return null;
  const map = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {selected.map((id) => (
        <button
          key={id}
          onClick={() => onRemove(id)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-1.5 text-slate-200 transition hover:border-sky-500 hover:text-white"
        >
          {map[id]}
          <span className="text-slate-400">✕</span>
        </button>
      ))}
      <button onClick={onClear} className="rounded-full px-3 py-1 text-slate-400 hover:text-slate-200">
        Limpiar todo
      </button>
    </div>
  );
}

function ProductGrid({ items, isLoggedIn, onAdd }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700/60 bg-slate-900/40 p-12 text-center text-sm text-slate-300">
        No encontramos resultados. Ajustá tus filtros para explorar más productos.
      </div>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} isLoggedIn={isLoggedIn} onAdd={onAdd} />
        </li>
      ))}
    </ul>
  );
}

function ProductGridSkeleton({ count = 8 }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="animate-pulse">
          <div className="h-full rounded-3xl border border-slate-800/70 bg-slate-900/60 p-4">
            <div className="aspect-square w-full rounded-2xl bg-slate-800/70" />
            <div className="mt-4 space-y-3">
              <div className="h-3 w-24 rounded bg-slate-800/60" />
              <div className="h-4 w-40 rounded bg-slate-800/60" />
              <div className="h-8 w-full rounded-xl bg-slate-800/60" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product, onAdd }) {
  const available = (product.stock ?? 0) > 0;
  return (
    <article className="group relative h-full overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/50 p-4 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.85)] transition duration-200 hover:-translate-y-1 hover:border-sky-500/60">
      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-slate-900">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-600">
            Sin imagen
          </div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {product.brand ? (
          <p className="text-xs uppercase tracking-wide text-slate-400">{product.brand}</p>
        ) : null}
        <h3 className="text-sm font-semibold text-white">{product.name}</h3>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${
              available
                ? "bg-emerald-400/10 text-emerald-200"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {available ? "Disponible" : "Sin stock"}
          </span>
          <span className="text-sm font-semibold text-white">{money(product.price)}</span>
        </div>
        <button
          disabled={!available}
          onClick={() => onAdd(product)}
          className={`flex w-full items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
            available
              ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-900/40 hover:translate-y-[-1px]"
              : "cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500"
          }`}
        >
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}

function CartDrawer({ open, onClose, cart, setQty, removeItem, total, isLoggedIn, onCheckout, products = [] }) {
  const getAvailable = (id) => {
    const product = products.find((p) => p.id === id);
    return Number(product?.stock ?? 0);
  };
  const stockProblems = cart.filter((it) => getAvailable(it.id) < it.qty);
  const checkoutDisabled = !cart.length || stockProblems.length > 0;

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md rounded-l-3xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Tu carrito</h3>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-slate-900/80">
            Cerrar
          </button>
        </div>

        {!cart.length ? (
          <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
            Todavía no agregaste productos.
          </div>
        ) : (
          <>
            <ul className="mt-4 max-h-[55vh] space-y-3 overflow-auto pr-2">
              {cart.map((it) => {
                const availableStock = getAvailable(it.id);
                const disableDecrease = it.qty <= 1;
                const disableIncrease = availableStock > 0 ? it.qty >= availableStock : true;
                return (
                  <li key={it.id} className="flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-900">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">Sin imagen</div>
                      )}
                    </div>
                    <div className="flex-1 text-sm text-slate-200">
                      <div className="font-medium text-white">{it.name}</div>
                      <div className="text-xs text-slate-400">{money(it.price)} c/u</div>
                      <div className="mt-3 inline-flex items-center gap-2">
                        <button
                          className="rounded-xl border border-slate-700 px-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                          onClick={() => setQty(it.id, it.qty - 1)}
                          disabled={disableDecrease}
                        >
                          –
                        </button>
                        <input
                          className="w-14 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-center text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                          type="number"
                          min={1}
                          max={availableStock || 1}
                          value={it.qty}
                          onChange={(e) => setQty(it.id, Number(e.target.value || 1))}
                        />
                        <button
                          className="rounded-xl border border-slate-700 px-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                          onClick={() => setQty(it.id, it.qty + 1)}
                          disabled={disableIncrease}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right text-sm text-slate-200">
                      <button
                        className="text-xs text-slate-400 hover:text-slate-200"
                        onClick={() => removeItem(it.id)}
                      >
                        Quitar
                      </button>
                      <div className="text-sm font-semibold text-white">{money(it.price * it.qty)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {stockProblems.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-xs text-amber-200">
                Revisá cantidades: hay productos con menos stock disponible del solicitado.
              </div>
            )}

            <div className="mt-6 space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="text-lg font-semibold text-white">{money(total)}</span>
              </div>
              <p className="text-xs text-slate-400">
                {isLoggedIn
                  ? "El pedido se cargará directamente como orden pagadera."
                  : "Si no iniciaste sesión, generaremos una solicitud para seguimiento manual."}
              </p>
              <button
                onClick={onCheckout}
                disabled={checkoutDisabled}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Avanzar con el pedido
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function OrderModal({ open, onClose, submitting, result, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setPaymentMethod("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Datos del pedido</h2>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-slate-900/70">
            Cerrar
          </button>
        </div>

        {result ? (
          <div className="mt-6 space-y-4">
            {result.ok ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
                ¡Listo! Tu pedido se creó con ID <b>{result.orderId}</b>. Te contactaremos a la brevedad.
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
                Hubo un error: {result.error}
              </div>
            )}
            <div className="text-right">
              <button onClick={onClose} className="rounded-2xl border border-slate-800/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/70">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit({ name, email, phone, notes, paymentMethod });
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Nombre</label>
              <input
                required
                className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Teléfono</label>
                <input
                  className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Notas</label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <fieldset className="space-y-3 text-sm text-slate-200">
              <legend className="text-xs font-medium uppercase tracking-wide text-slate-400">Método de pago</legend>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cheque"
                  checked={paymentMethod === "cheque"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                />
                Cheque
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="transferencia"
                  checked={paymentMethod === "transferencia"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Transferencia
              </label>
            </fieldset>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-800/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/70"
              >
                Cancelar
              </button>
              <button
                disabled={submitting || !paymentMethod}
                className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
              >
                <BusyButtonContent busy={submitting} busyLabel="Enviando…" label="Enviar pedido" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
