// components/ProductForm.tsx
import { useEffect, useRef, useState } from "react";
// Update the import path if the file is located elsewhere, for example:
import { createProduct, updateProduct, type Product } from "../../services/products";
// Or create the file at ../services/product.ts and export the required members.
import { subscribeProductTypes, type ProductType } from "../../services/productTypes";

const LEGACY_PREFIX = "legacy:";

const makeLegacyValue = (title: string) =>
  `${LEGACY_PREFIX}${encodeURIComponent((title || "").trim() || "general")}`;

const parseLegacyValue = (value: string) => {
  if (!value.startsWith(LEGACY_PREFIX)) return value;
  const raw = value.slice(LEGACY_PREFIX.length);
  try {
    return decodeURIComponent(raw);
  } catch (err) {
    console.error("Error decoding legacy value", err);
    return raw;
  }
};

type ProductFormProps = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Product> | null; // si viene, edita
  onSaved?: (p: Product) => void;    // opcional: avisar al padre
};

export default function ProductForm({ open, onClose, initial, onSaved }: ProductFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [sku, setSku] = useState(initial?.sku ? String(initial.sku) : "");
  const [price, setPrice] = useState<number | string>(initial?.price ?? 0);
  const [stock, setStock] = useState<number | string>(initial?.stock ?? 0);
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initial?.imageUrl || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productTypeId, setProductTypeId] = useState<string | null>(
    initial?.productTypeId ? String(initial.productTypeId) : null
  );
  const [productTypeTitle, setProductTypeTitle] = useState<string>(
    (initial?.productTypeTitle || initial?.category || "general") as string
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setName(initial?.name || "");
    setSku(initial?.sku ? String(initial.sku) : "");
    setPrice(initial?.price ?? 0);
    setStock(initial?.stock ?? 0);
    setActive(initial?.active ?? true);
    setImageFile(null);
    setPreview(initial?.imageUrl || "");
    setErrorMsg(null);
    const nextTypeTitle = (() => {
      const rawTitle = typeof initial?.productTypeTitle === "string" ? initial?.productTypeTitle : undefined;
      const legacyCategory = typeof initial?.category === "string" ? initial?.category : undefined;
      const normalizedTitle = (rawTitle || "").trim();
      if (normalizedTitle) return normalizedTitle;
      const normalizedLegacy = (legacyCategory || "").trim();
      return normalizedLegacy || "general";
    })();
    setProductTypeId(initial?.productTypeId ? String(initial.productTypeId) : null);
    setProductTypeTitle(nextTypeTitle);
  }, [initial, open]);

  useEffect(() => {
    const unsubscribe = subscribeProductTypes(
      (items) => setProductTypes(items || []),
      (error) => console.error("Error fetching product types", error)
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const normalizedCurrentTypeTitle = (productTypeTitle || "").trim() || "general";
  const currentLegacyValue = makeLegacyValue(normalizedCurrentTypeTitle);
  const selectProductTypeValue = productTypeId ?? currentLegacyValue;
  const hasLegacyTypeOption =
    !productTypeId &&
    normalizedCurrentTypeTitle !== "general" &&
    !productTypes.some(
      (type) =>
        (type.title || "").trim().toLowerCase() === normalizedCurrentTypeTitle.toLowerCase()
    );

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones de imagen (opcionales pero recomendadas)
    if (imageFile) {
      if (!/^image\//.test(imageFile.type)) {
        setErrorMsg("Solo se permiten archivos de imagen.");
        return;
      }
      const maxMB = 10;
      if (imageFile.size > maxMB * 1024 * 1024) {
        setErrorMsg(`La imagen supera ${maxMB}MB.`);
        return;
      }
    }

    // Normalizar números (valueAsNumber sería otra opción)
    const priceNum = Number(price ?? 0);
    const stockNum = Number(stock ?? 0);
    const normalizedTypeTitle = (productTypeTitle || "").trim() || "general";
    const normalizedSku = (sku || "").trim();

    setLoading(true);
    try {
      let saved: Product;
      if (initial?.id) {
        await updateProduct(initial.id, {
          name,
          sku: normalizedSku || null,
          price: priceNum,
          stock: stockNum,
          category: normalizedTypeTitle,
          productTypeId,
          productTypeTitle: normalizedTypeTitle,
          active,
          imageFile,
        });
        saved = {
          ...(initial as Product),
          name,
          sku: normalizedSku || null,
          price: priceNum,
          stock: stockNum,
          category: normalizedTypeTitle,
          productTypeId: productTypeId ?? null,
          productTypeTitle: normalizedTypeTitle,
          active,
          imageUrl: imageFile ? preview : (initial?.imageUrl ?? ""),
        } as Product;
      } else {
        const created = await createProduct({
          name,
          sku: normalizedSku || null,
          price: priceNum,
          stock: stockNum,
          category: normalizedTypeTitle,
          productTypeId,
          productTypeTitle: normalizedTypeTitle,
          active,
          imageFile,
        });
        saved = created;
      }

      onSaved?.(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Error guardando el producto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div ref={dialogRef} className="w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initial?.id ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-sm hover:bg-slate-50"
            disabled={loading}
          >
            Cerrar
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Nombre</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">SKU</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ingresá un número incremental"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">
                No puede repetirse con otro producto activo.
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1">Precio (ARS)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={price}
                onChange={e => setPrice(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Stock</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={stock}
                onChange={e => setStock(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Tipo de producto</label>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={selectProductTypeValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith(LEGACY_PREFIX)) {
                    const legacyTitle = (parseLegacyValue(value) || "general").trim();
                    setProductTypeId(null);
                    setProductTypeTitle(legacyTitle || "general");
                  } else {
                    const found = productTypes.find((type) => type.id === value);
                    const nextTitle = (found?.title || found?.identifier || value || "").trim();
                    setProductTypeId(value || null);
                    setProductTypeTitle(nextTitle || "general");
                  }
                }}
                disabled={loading}
              >
                <option value={makeLegacyValue("general")}>General</option>
                {productTypes.map((type) => {
                  const optionValue = type.id || makeLegacyValue(type.title);
                  const label = type.title || type.identifier || type.id || "Sin título";
                  return (
                    <option key={optionValue} value={optionValue}>
                      {label}
                    </option>
                  );
                })}
                {hasLegacyTypeOption && (
                  <option value={currentLegacyValue}>{normalizedCurrentTypeTitle}</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="active" className="text-sm">Activo</label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setImageFile(f);
                  if (f) {
                    const reader = new FileReader();
                    reader.onload = () => setPreview(String(reader.result));
                    reader.readAsDataURL(f);
                  } else {
                    setPreview(initial?.imageUrl || "");
                  }
                }}
                disabled={loading}
              />
              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="mt-2 h-32 w-32 object-cover rounded-lg border"
                />
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="text-sm text-red-600">{errorMsg}</div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200/60 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:translate-y-0 disabled:opacity-60"
              disabled={loading}
            >
              {loading
                ? (initial?.id ? "Guardando..." : "Creando...")
                : (initial?.id ? "Guardar cambios" : "Crear producto")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
