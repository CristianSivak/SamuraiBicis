// src/pages/catalog/CatalogPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "react-router-dom";
import { listProducts } from "../../services/products";
import { createOrder } from "../../services/orders";
import { getCustomerTypeById } from "../../services/customerTypes";
import { fetchEffectiveRate } from "../../services/exchangeRates";
import { getDollarConfig } from "../../services/dollarConfig";
import { validateCuit, formatCuit } from "../../utils/cuit";
import { LoadingOverlay, BusyButtonContent } from "../../components/ui/LoadingIndicators";

const SITE_URL = "https://samurai.ar";

function getProductImages(p) {
  if (p.images?.length) return p.images;
  return p.imageUrl ? [p.imageUrl] : [];
}

const TALLE_DOT_RE = /\bT\.(XS|S|M|L|XL)\b/i;
const TALLE_WORD_RE = /\bTALLE\s+(XS|S|M|L|XL)\b/i;
const COLOR_ONLY_RE = /\bCOLOR\s+(.+)$/i;

function normalizeColorLabel(raw) {
  return (raw || "")
    .replace(/\bGLOOS\b/gi, "GLOSS")
    .replace(/[-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Separa "modelo base" de "talle"/"color" a partir del nombre del producto.
// No todos los productos tienen variantes: si no matchea ningún patrón,
// colorLabel queda en null y el producto se muestra como item individual.
function parseVariant(name) {
  const raw = (name || "").trim();
  const match = raw.match(TALLE_DOT_RE) || raw.match(TALLE_WORD_RE);
  if (match) {
    const base = raw.slice(0, match.index).trim().replace(/[-–]\s*$/, "").trim();
    const rest = raw.slice(match.index + match[0].length).replace(/^[-–]\s*/, "");
    const colorLabel = normalizeColorLabel(rest);
    return { base, talle: match[1].toUpperCase(), colorLabel: colorLabel || null };
  }
  const colorOnly = raw.match(COLOR_ONLY_RE);
  if (colorOnly) {
    const base = raw.slice(0, colorOnly.index).trim();
    const colorLabel = normalizeColorLabel(colorOnly[1]);
    return { base, talle: null, colorLabel: colorLabel || null };
  }
  return { base: raw, talle: null, colorLabel: null };
}

const normalizeBase = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

const money = (n) =>
  Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

const formatUsd = (n) =>
  Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

const toArs = (usdPrice, exchangeRate) => {
  const rate = Number(exchangeRate);
  const usd = Number(usdPrice ?? 0);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  if (!Number.isFinite(usd)) return null;
  const ars = usd * rate;
  return Number.isFinite(ars) ? ars : null;
};

const getEffectivePrice = (price, discount, isLoggedIn) => {
  const basePrice = Number(price || 0);
  if (!isLoggedIn) {
    return basePrice;
  }
  const parsedDiscount = Number(discount || 0);
  if (!Number.isFinite(parsedDiscount) || parsedDiscount <= 0) {
    return basePrice;
  }
  const discounted = basePrice - (basePrice * parsedDiscount) / 100;
  if (!Number.isFinite(discounted)) {
    return basePrice;
  }
  return Math.max(discounted, 0);
};

const SORTS = [
  { id: "featured", label: "Destacado" },
  { id: "newest", label: "Llegadas más recientes" },
  { id: "name", label: "Nombre (A-Z)" },
  { id: "priceAsc", label: "Precio - bajo a alto" },
  { id: "priceDesc", label: "Precio - alto a bajo" },
];

export default function CatalogPage() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const isLoggedIn = !!user;
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
  const [discount, setDiscount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [exchangeRateDate, setExchangeRateDate] = useState(null);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState(null);
  const [rateMode, setRateMode] = useState(null);
  const [rateUsedFallback, setRateUsedFallback] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    let active = true;
    const customerTypeId = profile?.customerTypeId;

    if (!customerTypeId) {
      setDiscount(0);
      return () => {
        active = false;
      };
    }

    setDiscount(0);

    (async () => {
      try {
        const customerType = await getCustomerTypeById(customerTypeId);
        if (!active) return;
        const parsedDiscount = Number(customerType?.discount ?? 0);
        setDiscount(Number.isFinite(parsedDiscount) ? parsedDiscount : 0);
      } catch (error) {
        if (!active) return;
        console.error("Error obteniendo tipo de cliente:", error);
        setDiscount(0);
      }
    })();

    return () => {
      active = false;
    };
  }, [profile?.customerTypeId]);

  useEffect(() => {
    const controller = new AbortController();
    setExchangeRateLoading(true);
    setExchangeRateError(null);
    setRateUsedFallback(false);

    (async () => {
      try {
        const config = await getDollarConfig();
        const result = await fetchEffectiveRate(config, controller.signal);
        // En modo "disabled" igual usamos lastAutoValue para convertir precios USD→ARS internamente
        const rateValue = result.value > 0
          ? result.value
          : (result.mode === "disabled" && config.lastAutoValue > 0 ? config.lastAutoValue : 0);
        setExchangeRate(rateValue);
        setExchangeRateDate(result.date);
        setRateMode(result.mode);
        setRateUsedFallback(result.usedFallback);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Error obteniendo tipo de cambio", err);
        setExchangeRate(null);
        setExchangeRateDate(null);
        setExchangeRateError(
          "No pudimos actualizar el tipo de cambio. Los valores en USD se muestran sin conversión."
        );
      } finally {
        setExchangeRateLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

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
        const latestPriceUsd = Number(product?.price ?? item.priceUsd ?? 0);
        if (clampedQty !== item.qty) {
          changed = true;
          next.push({ ...item, qty: clampedQty, priceUsd: latestPriceUsd });
        } else {
          const latestImageUrl = getProductImages(product)[0] || "";
          const needsUpdate = item.priceUsd !== latestPriceUsd || item.imageUrl !== latestImageUrl;
          next.push(
            needsUpdate ? { ...item, priceUsd: latestPriceUsd, imageUrl: latestImageUrl } : item
          );
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
    setSelectedCats((prev) => (prev.length === 1 && prev[0] === id ? [] : [id]));

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

    const priceValue = (product) => {
      const ars = toArs(product.price, exchangeRate);
      const usd = Number(product.price || 0);
      if (Number.isFinite(ars)) return ars;
      return Number.isFinite(usd) ? usd : 0;
    };

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
        list = [...list].sort((a, b) => priceValue(a) - priceValue(b));
        break;
      case "priceDesc":
        list = [...list].sort((a, b) => priceValue(b) - priceValue(a));
        break;
      default:
        break;
    }
    return list;
  }, [items, selectedCats, search, sort, exchangeRate]);

  const catalogEntries = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const { base, talle, colorLabel } = parseVariant(p.name);
      if (!colorLabel) {
        map.set(`solo:${p.id}`, { isGroup: false, product: p });
        continue;
      }
      const key = `${p.category || "general"}::${normalizeBase(base)}`;
      if (!map.has(key)) {
        map.set(key, { isGroup: true, id: key, base, category: p.category, variants: [] });
      }
      map.get(key).variants.push({ product: p, talle, colorLabel });
    }
    const list = [];
    for (const entry of map.values()) {
      if (entry.isGroup && entry.variants.length === 1) {
        list.push({ isGroup: false, product: entry.variants[0].product });
      } else {
        list.push(entry);
      }
    }
    const categoryRank = (entry) => {
      const cat = (entry.isGroup ? entry.category : entry.product.category) || "";
      if (cat.toUpperCase() === "BICICLETAS") return 0;
      if (cat.toUpperCase() === "ACCESORIOS") return 1;
      return 2;
    };
    return list
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => categoryRank(a.entry) - categoryRank(b.entry) || a.index - b.index)
      .map(({ entry }) => entry);
  }, [filtered]);

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
          id:       p.id,
          name:     p.name,
          priceUsd: Number(p.price || 0),
          priceArs: p.priceArs != null ? Number(p.priceArs) : null,
          imageUrl: getProductImages(p)[0] || "",
          qty:      1,
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
    () =>
      cart.reduce((acc, it) => {
        const contabiliumArs = it.priceArs != null ? Number(it.priceArs) : null;
        const convertedArs   = toArs(it.priceUsd, exchangeRate);
        const base = Number.isFinite(contabiliumArs) && contabiliumArs > 0
          ? contabiliumArs
          : (Number.isFinite(convertedArs) ? convertedArs : Number(it.priceUsd || 0));
        return acc + getEffectivePrice(base, discount, isLoggedIn) * it.qty;
      }, 0),
    [cart, discount, isLoggedIn, exchangeRate]
  );

  async function submitOrder(customer) {
    setOrderResult(null);

    if (!cart.length) {
      setOrderResult({ ok: false, error: "Tu carrito está vacío." });
      return;
    }

    const orderItems = cart.map(({ id, name, priceUsd, priceArs: itemPriceArs, qty }) => {
      const contabiliumArs = itemPriceArs != null ? Number(itemPriceArs) : null;
      const convertedArs   = toArs(priceUsd, exchangeRate);
      const base = Number.isFinite(contabiliumArs) && contabiliumArs > 0
        ? contabiliumArs
        : (Number.isFinite(convertedArs) ? convertedArs : Number(priceUsd || 0));
      return {
        id,
        name,
        price: getEffectivePrice(base, discount, isLoggedIn),
        qty,
      };
    });
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
      });
      setOrderResult({ ok: true, orderId });
      const orderTotal = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      const lines = [
        "Hola Samurai Bicis, este es el pedido que realicé:",
        "",
        `Nombre: ${customer.name}`,
        customer.cuit ? `CUIT: ${customer.cuit}` : null,
        customer.email ? `Email: ${customer.email}` : null,
        customer.phone ? `Teléfono: ${customer.phone}` : null,
        customer.notes ? `Notas: ${customer.notes}` : null,
        "",
        "Detalle del pedido:",
        ...orderItems.map((item) =>
          `• ${item.name} x${item.qty} — ${money(item.price)} c/u — Subtotal: ${money(item.price * item.qty)}`
        ),
        "",
        `Total: ${money(orderTotal)}`,
        orderId ? `ID de pedido: ${orderId}` : null,
      ].filter(Boolean);
      const whatsappMessage = encodeURIComponent(lines.join("\n"));
      const whatsappNumber = "543624405220";
      window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank");
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

  // Scroll to a product highlighted via URL ?p=PRODUCT_ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const productId = params.get("p");
    if (!productId || !items.length) return;
    let el = document.getElementById(`product-${productId}`);
    if (!el) {
      const owningEntry = catalogEntries.find((entry) =>
        entry.isGroup
          ? entry.variants.some((v) => v.product.id === productId)
          : entry.product.id === productId
      );
      if (owningEntry) {
        const key = owningEntry.isGroup ? owningEntry.id : owningEntry.product.id;
        el = document.getElementById(`product-${key}`);
      }
    }
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [items, catalogEntries, location.search]);

  const showSkeleton = loading && !initialLoaded;
  const showOverlay = loading && initialLoaded;
  const closeProductModal = () => setSelectedEntry(null);
  const showUsd = rateMode !== "disabled";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(165,180,252,0.18),_transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-400 via-indigo-400 to-slate-300" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              Descubrí todo nuestro portfolio
            </h1>
            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/40 transition hover:-translate-y-0.5"
            >
              Carrito ({cart.length})
            </button>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <button
              onClick={() => {
                setSelectedCats(["BICICLETAS"]);
                document.getElementById("catalogo-resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 text-left shadow-[0_30px_60px_-40px_rgba(15,23,42,0.2)] transition hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-[0_40px_80px_-40px_rgba(15,23,42,0.28)]"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl transition group-hover:bg-sky-300/60" />
              <span className="relative text-3xl font-semibold text-slate-900 sm:text-4xl">Bicicletas</span>
              <p className="relative mt-3 text-sm text-slate-500">Ver todo el catálogo de bicicletas Samurai.</p>
            </button>
            <button
              onClick={() => {
                setSelectedCats(["ACCESORIOS"]);
                document.getElementById("catalogo-resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 text-left shadow-[0_30px_60px_-40px_rgba(15,23,42,0.2)] transition hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-[0_40px_80px_-40px_rgba(15,23,42,0.28)]"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-200/50 blur-3xl transition group-hover:bg-indigo-300/60" />
              <span className="relative text-3xl font-semibold text-slate-900 sm:text-4xl">Accesorios</span>
              <p className="relative mt-3 text-sm text-slate-500">Ver todo el catálogo de accesorios.</p>
            </button>
          </div>
        </div>
      </section>

      <div id="catalogo-resultados" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center gap-3 sm:max-w-sm">
                <div className="flex-1">
                  <label className="sr-only">Buscar</label>
                  <input
                    type="search"
                    placeholder="Buscar por producto o marca"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
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

            {(() => {
              const hasGroups = catalogEntries.some((entry) => entry.isGroup);
              const hasStandalone = catalogEntries.some((entry) => !entry.isGroup);
              if (!hasGroups) return null;
              return (
                <p className="text-sm text-slate-500">
                  {hasStandalone
                    ? "Las bicicletas tienen distintos colores y talles: elegí un modelo para verlos. Los accesorios se agregan directo al carrito."
                    : "Elegí un modelo para ver sus colores y talles disponibles."}
                </p>
              );
            })()}

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_50px_80px_-45px_rgba(15,23,42,0.18)]">
              {showOverlay && (
                <LoadingOverlay
                  label="Actualizando catálogo…"
                  className="rounded-[inherit] border border-slate-200 bg-white/90 text-slate-600"
                  labelClassName="text-slate-500"
                />
              )}
              {showSkeleton ? (
                <ProductGridSkeleton />
              ) : (
                <ProductGrid
                  entries={catalogEntries}
                  isLoggedIn={isLoggedIn}
                  discount={discount}
                  onAdd={addToCart}
                  exchangeRate={exchangeRate}
                  showUsd={showUsd}
                  onSelect={setSelectedEntry}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setQty={setQty}
        removeItem={removeFromCart}
        total={cartTotal}
        isLoggedIn={isLoggedIn}
        discount={discount}
        exchangeRate={exchangeRate}
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

      <ProductModal
        entry={selectedEntry}
        onClose={closeProductModal}
        isLoggedIn={isLoggedIn}
        discount={discount}
        exchangeRate={exchangeRate}
        showUsd={showUsd}
        onAdd={(product) => {
          addToCart(product);
          closeProductModal();
          setCartOpen(true);
        }}
      />

      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        submitting={orderSubmitting}
        result={orderResult}
        onSubmit={submitOrder}
        profile={profile}
      />
    </main>
  );
}

function SortBar({ sort, setSort }) {
  return (
    <div className="shrink-0">
      <label className="sr-only">Ordenar</label>
      <select
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
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
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-slate-600 transition hover:border-sky-500 hover:text-slate-900"
        >
          {map[id]}
          <span className="text-slate-500">✕</span>
        </button>
      ))}
      <button onClick={onClear} className="rounded-full px-3 py-1 text-slate-500 hover:text-slate-600">
        Limpiar todo
      </button>
    </div>
  );
}

function ProductGrid({ entries, isLoggedIn, discount = 0, onAdd, exchangeRate, showUsd = true, onSelect }) {
  if (!entries.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300/60 bg-white p-12 text-center text-sm text-slate-500">
        No encontramos resultados. Ajustá tus filtros para explorar más productos.
      </div>
    );
  }
  return (
    <ul className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {entries.map((entry) => {
        const key = entry.isGroup ? entry.id : entry.product.id;
        return (
          <li key={key} id={`product-${key}`}>
            {entry.isGroup ? (
              <GroupCard
                entry={entry}
                isLoggedIn={isLoggedIn}
                exchangeRate={exchangeRate}
                showUsd={showUsd}
                onSelect={() => onSelect?.(entry)}
              />
            ) : (
              <ProductCard
                product={entry.product}
                isLoggedIn={isLoggedIn}
                discount={discount}
                onAdd={onAdd}
                exchangeRate={exchangeRate}
                showUsd={showUsd}
                onSelect={() => onSelect?.(entry)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function GroupCard({ entry, isLoggedIn, exchangeRate, showUsd = true, onSelect }) {
  const withImages = entry.variants.find((v) => getProductImages(v.product).length);
  const image = withImages ? getProductImages(withImages.product)[0] : null;
  const brand = entry.variants[0]?.product.brand;
  const available = entry.variants.some((v) => Number(v.product.stock ?? 0) > 0);
  const usdPrices = entry.variants
    .map((v) => Number(v.product.price || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  const minPriceUsd = usdPrices.length ? Math.min(...usdPrices) : null;
  const minPriceArs = minPriceUsd != null ? toArs(minPriceUsd, exchangeRate) : null;
  const colorsCount = new Set(entry.variants.map((v) => v.colorLabel)).size;

  return (
    <article
      className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-1 hover:border-sky-500/60"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-100 bg-white">
        {image ? (
          <img src={image} alt={entry.base} className="h-full w-full object-contain p-1" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-600">Sin imagen</div>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {brand ? <p className="text-xs uppercase tracking-wide text-slate-500">{brand}</p> : null}
        <h3 className="text-sm font-semibold text-slate-900">{entry.base}</h3>
        <p className="text-xs text-slate-500">{colorsCount} {colorsCount === 1 ? "color" : "colores"} disponibles</p>
        <div className="space-y-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              available ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {available ? "Disponible" : "Sin stock"}
          </span>
          {!isLoggedIn ? (
            <p className="text-xs text-slate-500">Iniciá sesión para ver el precio</p>
          ) : minPriceArs != null ? (
            <div>
              <div className="text-sm font-semibold text-slate-900">Desde {money(minPriceArs)}</div>
              {showUsd && (
                <div className="text-[10px] text-slate-400">Desde {formatUsd(minPriceUsd)} USD</div>
              )}
            </div>
          ) : null}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-200/60 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
        >
          Ver colores y talles
        </button>
      </div>
    </article>
  );
}

function ProductGridSkeleton({ count = 8 }) {
  return (
    <ul className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="animate-pulse">
          <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="aspect-[4/3] w-full rounded-xl bg-slate-200" />
            <div className="mt-4 space-y-3">
              <div className="h-3 w-24 rounded bg-slate-200/80" />
              <div className="h-4 w-40 rounded bg-slate-200/80" />
              <div className="h-8 w-full rounded-xl bg-slate-200/80" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product, onAdd, discount = 0, isLoggedIn, exchangeRate, showUsd = true, onSelect }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePos, setSharePos] = useState({ top: 0, right: 0 });
  const shareButtonRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const timerRef = useRef(null);
  const images = getProductImages(product);
  const available = (product.stock ?? 0) > 0;

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (!shareOpen) return;
    const close = () => setShareOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [shareOpen]);

  const productUrl = `${SITE_URL}/catalogo?p=${product.id}`;

  function shareToWhatsApp() {
    const text = encodeURIComponent(`Mirá esta bici: ${product.name} — ${productUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareOpen(false);
  }

  function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer.php?u=${encodeURIComponent(productUrl)}`, "_blank");
    setShareOpen(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(productUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setShareOpen(false);
  }

  function copyImageForInstagram() {
    const url = images[0] || productUrl;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setShareOpen(false);
  }
  const effectiveDiscount = Number.isFinite(Number(discount)) ? Number(discount) : 0;
  const priceUsd = Number(product?.price || 0);
  const contabiliumArs = product.priceArs != null ? Number(product.priceArs) : null;
  const convertedArs = toArs(priceUsd, exchangeRate);
  const basePriceArs = Number.isFinite(contabiliumArs) && contabiliumArs > 0
    ? contabiliumArs
    : (Number.isFinite(convertedArs) && convertedArs > 0 ? convertedArs : null);
  const discountedPriceArs = getEffectivePrice(basePriceArs ?? 0, effectiveDiscount, isLoggedIn);
  const discountedPriceUsd = getEffectivePrice(priceUsd, effectiveDiscount, isLoggedIn);
  const hasDiscount =
    isLoggedIn &&
    effectiveDiscount > 0 &&
    basePriceArs != null &&
    discountedPriceArs !== basePriceArs &&
    basePriceArs > 0;
  return (
    <article
      className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-1 hover:border-sky-500/60"
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(product);
        }
      }}
      onMouseEnter={() => {
        if (images.length > 1) {
          timerRef.current = setInterval(
            () => setActiveImg((c) => (c + 1) % images.length),
            1200
          );
        }
      }}
      onMouseLeave={() => {
        clearInterval(timerRef.current);
        setActiveImg(0);
      }}
    >
      {/* Share button */}
      <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
        <button
          ref={shareButtonRef}
          onClick={() => {
            const rect = shareButtonRef.current?.getBoundingClientRect();
            if (rect) setSharePos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
            setShareOpen((v) => !v);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur transition hover:bg-white"
          title="Compartir"
        >
          <ShareIcon className="h-3.5 w-3.5 text-slate-500" />
        </button>
        {shareOpen && createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setShareOpen(false)} />
            <div className="fixed z-[100] w-44 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl" style={{ top: sharePos.top, right: sharePos.right }}>
              <button onClick={shareToWhatsApp} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                <span className="text-emerald-500">W</span> WhatsApp
              </button>
              <button onClick={shareToFacebook} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                <span className="text-blue-600">f</span> Facebook
              </button>
              <button onClick={copyImageForInstagram} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                <span className="text-pink-500">📷</span> Instagram (copiar URL)
              </button>
              <button onClick={copyLink} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                <span>🔗</span> Copiar link
              </button>
            </div>
          </>,
          document.body
        )}
        {copied && (
          <div className="absolute right-0 top-9 z-20 rounded-xl bg-slate-900 px-2 py-1 text-[10px] text-white shadow">
            ¡Copiado!
          </div>
        )}
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-100 bg-white">
        {images.length > 0 ? (
          <img
            src={images[activeImg]}
            alt={product.name}
            className="h-full w-full object-contain p-1 transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-600">
            Sin imagen
          </div>
        )}
        {images.length > 1 && (
          <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
            {images.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`h-1 w-1 rounded-full transition-colors ${
                  i === activeImg ? "bg-sky-500" : "bg-slate-300"
                }`}
              />
            ))}
            {images.length > 5 && (
              <span className="text-[9px] text-slate-400">+{images.length - 5}</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {product.brand ? (
          <p className="text-xs uppercase tracking-wide text-slate-500">{product.brand}</p>
        ) : null}
        <h3 className="text-sm font-semibold text-slate-900">{product.name}</h3>
        {product.description ? (
          <p
            className="text-xs leading-relaxed text-slate-600"
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {product.description}
          </p>
        ) : null}
        <div className="space-y-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              available ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {available ? "Disponible" : "Sin stock"}
          </span>
          {!isLoggedIn ? (
            <p className="text-xs text-slate-500">Iniciá sesión para ver el precio</p>
          ) : (
            <>
              {basePriceArs != null && basePriceArs > 0 ? (
                <div>
                  {hasDiscount && (
                    <div className="text-[10px] font-medium text-slate-400 line-through">
                      {money(basePriceArs)}
                    </div>
                  )}
                  <div className="text-sm font-semibold text-slate-900">
                    {money(hasDiscount ? discountedPriceArs : basePriceArs)}
                  </div>
                  {showUsd && (
                    <div className="text-[10px] text-slate-400">
                      {hasDiscount
                        ? <><span className="line-through mr-1">{formatUsd(priceUsd)}</span>{formatUsd(discountedPriceUsd)} USD</>
                        : <>{formatUsd(discountedPriceUsd)} USD</>
                      }
                    </div>
                  )}
                </div>
              ) : null}
              {hasDiscount && (
                <p className="text-[10px] text-emerald-600">Descuento del {effectiveDiscount}%</p>
              )}
            </>
          )}
        </div>
        <button
          disabled={!available}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          className={`flex w-full items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
            available
              ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-200/60 hover:-translate-y-0.5"
              : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
          }`}
        >
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}

function ImageGallery({ images, productName }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(images.length - 1, c + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);

  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
        Sin imagen
      </div>
    );
  }

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(images.length - 1, c + 1));

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-50"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          if (delta > 40) prev();
          else if (delta < -40) next();
          touchStartX.current = null;
        }}
      >
        <img
          src={images[current]}
          alt={productName}
          className="h-full w-full object-contain p-2 transition-opacity duration-200"
          loading={current === 0 ? "eager" : "lazy"}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              disabled={current === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow backdrop-blur transition hover:bg-white disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4 text-slate-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              disabled={current === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow backdrop-blur transition hover:bg-white disabled:opacity-30"
            >
              <ChevronRightIcon className="h-4 w-4 text-slate-700" />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
                {current + 1} / {images.length}
              </span>
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === current ? "border-sky-500" : "border-transparent hover:border-slate-300"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalShell({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <button
          className="sticky top-4 float-right mr-4 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-200 z-10"
          onClick={onClose}
        >
          Cerrar
        </button>
        <div className="flex flex-col gap-6 p-6">{children}</div>
      </div>
    </div>
  );
}

function ProductDetailBody({ product, onClose, isLoggedIn, discount = 0, exchangeRate, showUsd = true, onAdd }) {
  const images = getProductImages(product);
  const available = (product.stock ?? 0) > 0;
  const effectiveDiscount = Number.isFinite(Number(discount)) ? Number(discount) : 0;
  const priceUsd = Number(product?.price || 0);
  const priceArs = toArs(priceUsd, exchangeRate);
  const basePriceArs = Number.isFinite(priceArs) ? priceArs : priceUsd;
  const discountedPriceArs = getEffectivePrice(basePriceArs, effectiveDiscount, isLoggedIn);
  const discountedPriceUsd = getEffectivePrice(priceUsd, effectiveDiscount, isLoggedIn);
  const hasDiscount =
    isLoggedIn && effectiveDiscount > 0 && discountedPriceArs !== basePriceArs && basePriceArs > 0;

  return (
    <>
      <div>
        <ImageGallery images={images} productName={product.name} />
      </div>
      <div className="space-y-4 text-slate-700">
        {product.brand ? (
          <p className="text-xs uppercase tracking-wide text-slate-500">{product.brand}</p>
        ) : null}
        <h3 className="text-2xl font-semibold text-slate-900">{product.name}</h3>
        {product.description ? (
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{product.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium ${
              available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
            {available ? "Disponible" : "Sin stock"}
          </span>
          {Number.isFinite(product?.stock) ? (
            <span className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-slate-600">Stock: {product.stock}</span>
          ) : null}
          {product.category ? (
            <span className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-slate-600">Categoría: {product.category}</span>
          ) : null}
        </div>
        <div className="space-y-1 text-sm font-medium text-slate-900">
          {!isLoggedIn ? (
            <p className="text-sm text-slate-500">Iniciá sesión para ver el precio</p>
          ) : (
            <>
              {Number.isFinite(priceArs) ? (
                hasDiscount ? (
                  <>
                    <span className="mr-2 text-base font-semibold line-through text-slate-400">{money(basePriceArs)}</span>
                    <span className="text-2xl font-semibold">{money(discountedPriceArs)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-semibold">{money(discountedPriceArs)}</span>
                )
              ) : null}
              {showUsd && Number.isFinite(priceArs) && (
                <div className="text-xs font-medium text-slate-600">
                  {hasDiscount ? (
                    <>
                      <span className="mr-2 line-through text-slate-400">{formatUsd(priceUsd)}</span>
                      <span>{formatUsd(discountedPriceUsd)} USD</span>
                    </>
                  ) : (
                    <span>{formatUsd(discountedPriceUsd)} USD</span>
                  )}
                </div>
              )}
              {hasDiscount && (
                <p className="text-xs text-emerald-600">Descuento activo del {effectiveDiscount}%.</p>
              )}
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          {product.sku ? <span className="rounded-full bg-slate-50 px-3 py-1.5">SKU: {product.sku}</span> : null}
          {product.reference ? (
            <span className="rounded-full bg-slate-50 px-3 py-1.5">Referencia: {product.reference}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={!available}
            onClick={() => onAdd?.(product)}
            className={`flex items-center justify-center rounded-2xl px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
              available
                ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-200/60 hover:-translate-y-0.5"
                : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
            }`}
          >
            Agregar al carrito
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

const TALLE_ORDER = ["XS", "S", "M", "L", "XL"];

function ProductModal({ entry, onClose, isLoggedIn, discount = 0, exchangeRate, showUsd = true, onAdd }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedTalle, setSelectedTalle] = useState(null);
  const entryKey = entry ? (entry.isGroup ? entry.id : entry.product.id) : null;

  useEffect(() => {
    setSelectedColor(null);
    setSelectedTalle(null);
  }, [entryKey]);

  if (!entry) return null;

  if (!entry.isGroup) {
    return (
      <ModalShell onClose={onClose}>
        <ProductDetailBody
          product={entry.product}
          onClose={onClose}
          isLoggedIn={isLoggedIn}
          discount={discount}
          exchangeRate={exchangeRate}
          showUsd={showUsd}
          onAdd={onAdd}
        />
      </ModalShell>
    );
  }

  const colors = Array.from(new Set(entry.variants.map((v) => v.colorLabel)));
  const variantsForColor = selectedColor
    ? entry.variants.filter((v) => v.colorLabel === selectedColor)
    : [];
  const talles = Array.from(new Set(variantsForColor.map((v) => v.talle).filter(Boolean))).sort(
    (a, b) => TALLE_ORDER.indexOf(a) - TALLE_ORDER.indexOf(b)
  );
  const resolvedVariant =
    variantsForColor.length === 1
      ? variantsForColor[0]
      : selectedTalle
      ? variantsForColor.find((v) => v.talle === selectedTalle) || null
      : null;

  if (resolvedVariant) {
    return (
      <ModalShell onClose={onClose}>
        <button
          onClick={() => setSelectedTalle(null)}
          className="self-start text-xs font-semibold text-sky-600 transition hover:text-sky-700"
        >
          ‹ Elegir otro talle
        </button>
        <ProductDetailBody
          product={resolvedVariant.product}
          onClose={onClose}
          isLoggedIn={isLoggedIn}
          discount={discount}
          exchangeRate={exchangeRate}
          showUsd={showUsd}
          onAdd={onAdd}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 shadow-sm">
          Elegí tu combinación
        </span>
        <h3 className="text-2xl font-semibold text-slate-900">{entry.base}</h3>
        <p className="text-sm text-slate-600">Elegí color y talle para ver el detalle.</p>
      </div>

      {selectedColor && (
        <button
          onClick={() => {
            setSelectedColor(null);
            setSelectedTalle(null);
          }}
          className="self-start text-xs font-semibold text-sky-600 transition hover:text-sky-700"
        >
          ‹ Elegir otro color
        </button>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">Elegí un color</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => {
            const hasStock = entry.variants.some(
              (v) => v.colorLabel === color && Number(v.product.stock ?? 0) > 0
            );
            const active = selectedColor === color;
            return (
              <button
                key={color}
                onClick={() => {
                  setSelectedColor(color);
                  setSelectedTalle(null);
                }}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-200/60"
                    : hasStock
                    ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {color}
                {!hasStock ? " (sin stock)" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {selectedColor && talles.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Elegí un talle</p>
          <div className="flex flex-wrap gap-2">
            {talles.map((talle) => {
              const variant = variantsForColor.find((v) => v.talle === talle);
              const hasStock = Number(variant?.product.stock ?? 0) > 0;
              const active = selectedTalle === talle;
              return (
                <button
                  key={talle}
                  onClick={() => setSelectedTalle(talle)}
                  className={`h-11 min-w-[2.75rem] rounded-2xl border px-4 text-sm font-semibold transition ${
                    active
                      ? "border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-200/60"
                      : hasStock
                      ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {talle}
                  {!hasStock ? " ✕" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function CartDrawer({
  open,
  onClose,
  cart,
  setQty,
  removeItem,
  total,
  isLoggedIn,
  discount = 0,
  onCheckout,
  products = [],
  exchangeRate,
}) {
  const effectiveDiscount = Number.isFinite(Number(discount)) ? Number(discount) : 0;
  const getAvailable = (id) => {
    const product = products.find((p) => p.id === id);
    return Number(product?.stock ?? 0);
  };
  const stockProblems = cart.filter((it) => getAvailable(it.id) < it.qty);
  const checkoutDisabled = !cart.length || stockProblems.length > 0;

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md rounded-l-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Tu carrito</h3>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">
            Cerrar
          </button>
        </div>

        {!cart.length ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Todavía no agregaste productos.
          </div>
        ) : (
          <>
            <ul className="mt-4 max-h-[55vh] space-y-3 overflow-auto pr-2">
              {cart.map((it) => {
                const availableStock = getAvailable(it.id);
                const disableDecrease = it.qty <= 1;
                const disableIncrease = availableStock > 0 ? it.qty >= availableStock : true;
                const priceUsd = Number(it.priceUsd || 0);
                const priceArs = toArs(priceUsd, exchangeRate);
                const basePrice = Number.isFinite(priceArs) ? priceArs : priceUsd;
                const unitPrice = getEffectivePrice(basePrice, effectiveDiscount, isLoggedIn);
                const unitPriceUsd = getEffectivePrice(priceUsd, effectiveDiscount, isLoggedIn);
                const lineTotal = unitPrice * it.qty;
                const showDiscount =
                  isLoggedIn && effectiveDiscount > 0 && unitPrice !== basePrice && basePrice > 0;
                return (
                  <li key={it.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">Sin imagen</div>
                      )}
                    </div>
                    <div className="flex-1 text-sm text-slate-600">
                      <div className="font-medium text-slate-900">{it.name}</div>
                      {isLoggedIn ? (
                        <div className="text-xs text-slate-500 space-y-1">
                          {showDiscount ? (
                            <>
                              <span className="mr-2 line-through text-[11px] text-slate-400">
                                {money(basePrice)}
                              </span>
                              <span>{money(unitPrice)} c/u</span>
                            </>
                          ) : (
                            <span>{money(unitPrice)} c/u</span>
                          )}
                          <div className="text-[11px] text-slate-500">
                            {showDiscount ? (
                              <>
                                <span className="mr-2 line-through text-slate-400">
                                  {formatUsd(priceUsd)}
                                </span>
                                <span>{formatUsd(unitPriceUsd)} USD c/u</span>
                              </>
                            ) : (
                              <span>{formatUsd(unitPriceUsd)} USD c/u</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">Precio visible al iniciar sesión</div>
                      )}
                      <div className="mt-3 inline-flex items-center gap-2">
                        <button
                          className="rounded-xl border border-slate-300 px-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                          onClick={() => setQty(it.id, it.qty - 1)}
                          disabled={disableDecrease}
                        >
                          –
                        </button>
                        <input
                          className="w-14 rounded-xl border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                          type="number"
                          min={1}
                          max={availableStock || 1}
                          value={it.qty}
                          onChange={(e) => setQty(it.id, Number(e.target.value || 1))}
                        />
                        <button
                          className="rounded-xl border border-slate-300 px-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                          onClick={() => setQty(it.id, it.qty + 1)}
                          disabled={disableIncrease}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right text-sm text-slate-600">
                      <button
                        className="text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => removeItem(it.id)}
                      >
                        Quitar
                      </button>
                      {isLoggedIn ? (
                        <div className="text-sm font-semibold text-slate-900">{money(lineTotal)}</div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {stockProblems.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-600">
                Revisá cantidades: hay productos con menos stock disponible del solicitado.
              </div>
            )}

            <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="text-lg font-semibold text-slate-900">
                  {isLoggedIn ? money(total) : "Iniciá sesión para ver"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isLoggedIn
                  ? "El pedido se cargará directamente como orden pagadera."
                  : "Si no iniciaste sesión, generaremos una solicitud con tu selección para seguimiento manual."}
              </p>
              {isLoggedIn && effectiveDiscount > 0 ? (
                <p className="text-xs text-emerald-600">
                  Tenés un descuento del {effectiveDiscount}% activo para tus precios.
                </p>
              ) : null}
              <button
                onClick={onCheckout}
                disabled={checkoutDisabled}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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

function OrderModal({ open, onClose, submitting, result, onSubmit, profile }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [cuit, setCuit] = useState("");
  const [cuitError, setCuitError] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setCuit("");
      setCuitError("");
    } else {
      // Auto-fill CUIT from user profile if available
      if (profile?.cuit) setCuit(profile.cuit);
    }
  }, [open, profile]);

  function onCuitChange(e) {
    const formatted = formatCuit(e.target.value);
    setCuit(formatted);
    setCuitError("");
  }

  function onCuitBlur() {
    if (cuit && !validateCuit(cuit)) {
      setCuitError("CUIT inválido. Ingresá los 11 dígitos correctamente.");
    } else {
      setCuitError("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!cuit) {
      setCuitError("El CUIT es obligatorio.");
      return;
    }
    if (!validateCuit(cuit)) {
      setCuitError("CUIT inválido. Ingresá los 11 dígitos correctamente.");
      return;
    }
    onSubmit({ name, email, phone, notes, cuit });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Datos del pedido</h2>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">
            Cerrar
          </button>
        </div>

        {result ? (
          <div className="mt-6 space-y-4">
            {result.ok ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-600">
                ¡Listo! Tu pedido se creó con ID <b>{result.orderId}</b>. Te contactaremos a la brevedad.
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
                Hubo un error: {result.error}
              </div>
            )}
            <div className="text-right">
              <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                CUIT <span className="text-rose-500">*</span>
              </label>
              <input
                required
                placeholder="XX-XXXXXXXX-X"
                inputMode="numeric"
                className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${
                  cuitError
                    ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/40"
                    : "border-slate-200 focus:border-sky-500 focus:ring-sky-500/40"
                }`}
                value={cuit}
                onChange={onCuitChange}
                onBlur={onCuitBlur}
              />
              {profile?.cuit && cuit === profile.cuit && (
                <p className="text-xs text-sky-600">Auto-completado desde tu perfil.</p>
              )}
              {cuitError && <p className="text-xs text-rose-500">{cuitError}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Teléfono</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Notas</label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                disabled={submitting || !!cuitError}
                className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
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

function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
