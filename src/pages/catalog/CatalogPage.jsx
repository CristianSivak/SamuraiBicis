// src/pages/catalog/CatalogPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../../services/products";
import { createOrder } from "../../services/orders";

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

  const [items, setItems] = useState([]);     // productos Firestore
  const [loading, setLoading] = useState(true);

  // carrito
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);       // [{id,name,price,imageUrl,qty}]
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null); // {ok, orderId, error}

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { items } = await listProducts({
          onlyActive: "true",
          category: "all",
          q: "",
          pageSize: 200,
        });
        setItems(items);
      } catch (e) {
        console.error("Error listando productos:", e?.code, e?.message);
        alert("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // categorías dinámicas desde productos
  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category || "general"));
    return Array.from(set).sort().map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
    }));
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

  // carrito
  const addToCart = (p) => {
    setCartOpen(true);
    setCart((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(999, next[i].qty + 1) };
        return next;
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
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(999, qty)) } : x))
        .filter((x) => x.qty > 0)
    );
  const removeFromCart = (id) => setCart((prev) => prev.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);

  const cartTotal = useMemo(
    () => cart.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0),
    [cart]
  );

  async function submitOrder(data) {
    try {
      setOrderSubmitting(true);
      const orderId = await createOrder({
        customer: data, // {name,email,phone,notes}
        items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      });
      setOrderResult({ ok: true, orderId });
      clearCart();
    } catch (e) {
      console.error(e);
      setOrderResult({ ok: false, error: e?.message || "Error al crear el pedido" });
    } finally {
      setOrderSubmitting(false);
    }
  }

  return (
    <main className="bg-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Catálogo</h1>
            <p className="mt-1 text-sm text-gray-600">
              Explorá categorías, filtra y ordená.{" "}
              {isLoggedIn ? "" : "Iniciá sesión para ver precios y comprar."}
            </p>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Carrito ({cart.length})
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 mt-6">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block lg:col-span-3">
            <FiltersSidebar
              categories={categories}
              selected={selectedCats}
              onToggle={toggleCategory}
              onClear={clearFilters}
            />
          </aside>

          {/* Content */}
          <section className="lg:col-span-9">
            {/* Top controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                className="inline-flex lg:hidden rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                onClick={() => setMobileOpen(true)}
              >
                Filtrar
              </button>

              <div className="flex-1">
                <label className="sr-only">Buscar</label>
                <input
                  type="search"
                  placeholder="Buscar por producto o marca"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <SortBar sort={sort} setSort={setSort} />
            </div>

            {/* Chips filtros activos */}
            <ActiveFilters
              categories={categories}
              selected={selectedCats}
              onRemove={(id) => toggleCategory(id)}
              onClear={clearFilters}
            />

            {/* Grid */}
            {loading ? (
              <div className="mt-10 text-center text-gray-600">Cargando…</div>
            ) : (
              <ProductGrid
                items={filtered}
                isLoggedIn={isLoggedIn}
                onAdd={addToCart}
              />
            )}
          </section>
        </div>
      </div>

      {/* Drawer mobile filtros */}
      <FiltersDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
        selected={selectedCats}
        onToggle={toggleCategory}
        onClear={clearFilters}
      />

      {/* Drawer carrito */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setQty={setQty}
        removeItem={removeFromCart}
        total={cartTotal}
        isLoggedIn={isLoggedIn}
        onCheckout={() => {
          setCartOpen(false);
          setOrderOpen(true);
          setOrderResult(null);
        }}
      />

      {/* Modal pedido */}
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

/* ======= Subcomponentes (igual que antes + carrito/pedido) ======= */

function FiltersSidebar({ categories, selected, onToggle, onClear }) {
  if (!categories.length) return null;
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Categorías</h3>
        <button onClick={onClear} className="text-xs text-gray-600 hover:text-gray-900">
          Borrar filtros
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <input
              id={`cat-${c.id}`}
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => onToggle(c.id)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <label htmlFor={`cat-${c.id}`} className="text-sm text-gray-800">
              {c.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FiltersDrawer({ open, onClose, categories, selected, onToggle, onClear }) {
  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-xl transition-transform
        ${open ? "translate-y-0" : "translate-y-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Filtrar</h3>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-50">
              <span className="sr-only">Cerrar</span>✕
            </button>
          </div>
          <div className="mt-3">
            <FiltersSidebar
              categories={categories}
              selected={selected}
              onToggle={onToggle}
              onClear={onClear}
            />
          </div>
          <div className="mt-4">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Ver resultados
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SortBar({ sort, setSort }) {
  return (
    <div>
      <label className="sr-only">Ordenar</label>
      <select
        className="rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
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
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {selected.map((id) => (
        <button
          key={id}
          onClick={() => onRemove(id)}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800"
        >
          {map[id]} <span className="text-gray-500">✕</span>
        </button>
      ))}
      <button onClick={onClear} className="text-xs text-gray-600 hover:text-gray-900">
        Limpiar todo
      </button>
    </div>
  );
}

function ProductGrid({ items, isLoggedIn, onAdd }) {
  if (!items.length) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed p-10 text-center text-gray-600">
        No encontramos resultados. Probá con otros filtros.
      </div>
    );
  }
  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} isLoggedIn={isLoggedIn} onAdd={onAdd} />
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product, onAdd }) {
  const available = (product.stock ?? 0) > 0;
  return (
    <div className="group rounded-2xl border p-3 transition hover:shadow-sm">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        {product.brand ? (
          <p className="text-xs text-gray-500">{product.brand}</p>
        ) : null}
        <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>

        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
              available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
            }`}
          >
            {available ? "Disponible" : "Sin stock"}
          </span>

            <span className="text-sm font-semibold text-gray-900">
              {money(product.price)}
            </span>
        </div>

        <div className="pt-2">
          <button
            disabled={!available}
            onClick={() => onAdd(product)}
            className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold ${
              available
                ? "bg-black text-white hover:bg-gray-900"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== Carrito + Pedido ========== */

function CartDrawer({ open, onClose, cart, setQty, removeItem, total, isLoggedIn, onCheckout }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md rounded-l-2xl bg-white p-4 shadow-xl transition-transform
        ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Tu carrito</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-50">✕</button>
        </div>

        {!cart.length ? (
          <div className="mt-6 text-center text-gray-600">Todavía no agregaste productos.</div>
        ) : (
          <>
            <ul className="mt-4 space-y-3 max-h-[60vh] overflow-auto pr-1">
              {cart.map((it) => (
                <li key={it.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} className="h-full w-full object-cover" alt="" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-gray-600">{money(it.price)} c/u</div>
                    <div className="mt-2 inline-flex items-center gap-2">
                      <button className="rounded-lg border px-2" onClick={() => setQty(it.id, it.qty - 1)}>-</button>
                      <input
                        className="w-12 rounded-lg border px-2 text-center text-sm"
                        type="number"
                        min={1}
                        max={999}
                        value={it.qty}
                        onChange={(e) => setQty(it.id, Number(e.target.value || 1))}
                      />
                      <button className="rounded-lg border px-2" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                    </div>
                  </div>
                  <button className="rounded-lg border px-3 py-1 text-xs" onClick={() => removeItem(it.id)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-base font-semibold">{money(total)}</div>
            </div>

            <button
              onClick={onCheckout}
              className="mt-3 w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Finalizar pedido
            </button>

            {!isLoggedIn && (
              <p className="mt-2 text-xs text-gray-500">
                * Si no iniciaste sesión, enviaremos tu pedido como **solicitud** (sin precio).
              </p>
            )}
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

  useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setPhone(""); setNotes("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Datos del pedido</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-50">✕</button>
        </div>

        {result ? (
          <div className="mt-4">
            {result.ok ? (
              <div className="rounded-xl border bg-green-50 p-4 text-green-800">
                ¡Listo! Tu pedido se creó con ID <b>{result.orderId}</b>. Te contactaremos a la brevedad.
              </div>
            ) : (
              <div className="rounded-xl border bg-red-50 p-4 text-red-800">
                Hubo un error: {result.error}
              </div>
            )}
            <div className="mt-4 text-right">
              <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit({ name, email, phone, notes });
            }}
          >
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <input required className="w-full rounded-xl border px-3 py-2 text-sm"
                     value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input type="email" required className="w-full rounded-xl border px-3 py-2 text-sm"
                       value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Teléfono</label>
                <input className="w-full rounded-xl border px-3 py-2 text-sm"
                       value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Notas</label>
              <textarea rows={3} className="w-full rounded-xl border px-3 py-2 text-sm"
                        value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button disabled={submitting}
                      className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-gray-900 disabled:opacity-50">
                {submitting ? "Enviando…" : "Enviar pedido"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
