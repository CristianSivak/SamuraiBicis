import { useMemo, useState } from "react";
import { createProduct, updateProduct } from "../../services/products";
import type { ProductType } from "../../services/productTypes";

const SHEET_JS_URL = "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";
const BATCH_SIZE = 5;

type NormalizedRow = {
  id?: string;
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
  productTypeId?: string;
  active?: boolean;
};

const HEADER_ALIASES: Record<string, keyof NormalizedRow> = {
  id: "id",
  identificador: "id",
  codigo: "id",
  code: "id",
  sku: "id",
  nombre: "name",
  name: "name",
  titulo: "name",
  title: "name",
  precio: "price",
  price: "price",
  precioars: "price",
  "precio_ars": "price",
  stock: "stock",
  cantidad: "stock",
  inventory: "stock",
  categoria: "category",
  "categoría": "category",
  category: "category",
  tipo: "category",
  segment: "category",
  "tipo_id": "productTypeId",
  producttypeid: "productTypeId",
  "product_type_id": "productTypeId",
  activo: "active",
  active: "active",
  estado: "active",
  disponible: "active",
};

const REQUIRED_FIELDS: Array<keyof NormalizedRow> = ["name", "price", "stock"];

type SheetjsModule = {
  read: (data: ArrayBuffer | string, opts: Record<string, unknown>) => any;
  utils: {
    sheet_to_json: (sheet: any, opts?: Record<string, unknown>) => any[];
  };
};

type PreparedPayload = {
  action: "create" | "update";
  data: {
    name: string;
    price: number;
    stock: number;
    category: string;
    productTypeId: string | null;
    productTypeTitle: string | null;
    active: boolean;
  };
  id?: string;
};

type ParsedRow = {
  index: number;
  raw: Record<string, unknown>;
  normalized: NormalizedRow;
  warnings: string[];
  errors: string[];
  payload?: PreparedPayload;
};

type ImportSummaryItem = {
  index: number;
  name: string;
  status: "fulfilled" | "rejected";
  action: PreparedPayload["action"];
  message?: string;
};

type ImportSummary = {
  total: number;
  attempted: number;
  created: number;
  updated: number;
  failed: number;
  results: ImportSummaryItem[];
};

type BulkProductImportProps = {
  open: boolean;
  onClose: () => void;
  onCompleted?: (summary: ImportSummary) => void;
  productTypes: ProductType[];
};

let cachedModule: SheetjsModule | null = null;

async function ensureSheetJs(): Promise<SheetjsModule> {
  if (cachedModule) return cachedModule;
  const mod = (await import(/* @vite-ignore */ SHEET_JS_URL)) as SheetjsModule;
  cachedModule = mod;
  return mod;
}

function normalizeHeader(header: unknown) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9_]+/g, "");
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function parseNumeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value
      .replace(/\s+/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .replace(/,/g, ".")
      .replace(/[^0-9+\-.]/g, "");
    const num = Number(normalized);
    return Number.isFinite(num) ? num : NaN;
  }
  return NaN;
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["si", "sí", "true", "1", "activo", "yes"].includes(normalized)
      ? true
      : ["no", "false", "0", "inactivo"].includes(normalized)
      ? false
      : undefined;
  }
  return undefined;
}

function findProductType(
  productTypes: ProductType[],
  category: string,
  explicitId?: string
) {
  const normalized = category.trim().toLowerCase();
  if (explicitId) {
    const found = productTypes.find((type) => (type.id || "").toLowerCase() === explicitId.toLowerCase());
    if (found) return found;
  }
  return (
    productTypes.find((type) => {
      const title = (type.title || "").trim().toLowerCase();
      const identifier = (type as any).identifier ? String((type as any).identifier).trim().toLowerCase() : null;
      return (
        title === normalized ||
        (!!identifier && identifier === normalized) ||
        (!!type.id && type.id.toLowerCase() === normalized)
      );
    }) || null
  );
}

async function readRowsFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const sheetjs = await ensureSheetJs();
  const isCsv = /\.(csv)$/i.test(file.name);
  const workbook = isCsv
    ? sheetjs.read(new TextDecoder().decode(arrayBuffer), { type: "string" })
    : sheetjs.read(arrayBuffer, { type: "array" });
  const [firstSheet] = workbook.SheetNames;
  if (!firstSheet) return [] as any[];
  const sheet = workbook.Sheets[firstSheet];
  return sheetjs.utils.sheet_to_json(sheet, { header: 1, defval: "" });
}

function buildParsedRows(
  rows: any[],
  productTypes: ProductType[]
): { parsed: ParsedRow[]; missingColumns: string[] } {
  if (!rows.length) {
    return { parsed: [], missingColumns: REQUIRED_FIELDS.map((field) => field) };
  }

  const [rawHeaders, ...rawData] = rows as (unknown[])[];
  const headerAliases = rawHeaders.map((header) => HEADER_ALIASES[normalizeHeader(header)] || null);

  const missingColumns = REQUIRED_FIELDS.filter((field) => !headerAliases.includes(field));

  const parsed: ParsedRow[] = rawData
    .map((cells, index) => {
      const raw: Record<string, unknown> = {};
      const normalized: ParsedRow["normalized"] = {};
      headerAliases.forEach((alias, colIndex) => {
        const value = Array.isArray(cells) ? cells[colIndex] : undefined;
        const originalHeader = rawHeaders[colIndex];
        if (originalHeader) {
          raw[String(originalHeader)] = value;
        }
        if (!alias) return;
        switch (alias) {
          case "id": {
            const idValue = normalizeString(value);
            if (idValue) normalized.id = idValue;
            break;
          }
          case "name": {
            const text = normalizeString(value);
            if (text) normalized.name = text;
            break;
          }
          case "price": {
            const num = parseNumeric(value);
            if (!Number.isNaN(num)) normalized.price = num;
            break;
          }
          case "stock": {
            const num = parseNumeric(value);
            if (!Number.isNaN(num)) normalized.stock = Math.round(num);
            break;
          }
          case "category": {
            const text = normalizeString(value);
            if (text) normalized.category = text;
            break;
          }
          case "productTypeId": {
            const text = normalizeString(value);
            if (text) normalized.productTypeId = text;
            break;
          }
          case "active": {
            const boolValue = parseBoolean(value);
            if (boolValue !== undefined) {
              normalized.active = boolValue;
            }
            break;
          }
          default:
            break;
        }
      });

      const errors: string[] = [];
      const warnings: string[] = [];

      REQUIRED_FIELDS.forEach((field) => {
        switch (field) {
          case "name":
            if (!normalized.name) {
              errors.push("Falta el campo obligatorio \"nombre\"");
            }
            break;
          case "price":
            if (normalized.price === undefined || Number.isNaN(normalized.price)) {
              errors.push("El precio es obligatorio y debe ser numérico");
            }
            break;
          case "stock":
            if (normalized.stock === undefined || Number.isNaN(normalized.stock)) {
              errors.push("El stock es obligatorio y debe ser numérico");
            }
            break;
          default:
            break;
        }
      });

      if (normalized.price !== undefined && normalized.price < 0) {
        errors.push("El precio no puede ser negativo");
      }

      if (normalized.stock !== undefined && normalized.stock < 0) {
        warnings.push("El stock es negativo; se importará igualmente");
      }

      const effectiveCategory = normalized.category || "general";
      const matchedType = findProductType(productTypes, effectiveCategory, normalized.productTypeId);
      let productTypeId: string | null = matchedType?.id || null;
      let productTypeTitle: string | null = matchedType?.title || effectiveCategory || "general";
      if (!matchedType && normalized.productTypeId) {
        warnings.push(
          `No se encontró un productType con ID \"${normalized.productTypeId}\"; se importará como categoría libre.`
        );
        productTypeId = null;
      } else if (!matchedType && normalized.category) {
        warnings.push(
          `La categoría \"${normalized.category}\" no coincide con los productTypes actuales; se creará como categoría histórica.`
        );
      }

      let payload: PreparedPayload | undefined;
      if (!errors.length && normalized.name && normalized.price !== undefined && normalized.stock !== undefined) {
        payload = {
          action: normalized.id ? "update" : "create",
          id: normalized.id,
          data: {
            name: normalized.name,
            price: normalized.price,
            stock: normalized.stock,
            category: productTypeTitle || effectiveCategory || "general",
            productTypeId,
            productTypeTitle,
            active: normalized.active ?? true,
          },
        };
      }

      return {
        index: index + 2,
        raw,
        normalized,
        warnings,
        errors,
        payload,
      };
    })
    .filter((row) => {
      const hasData = Object.values(row.raw).some((value) => normalizeString(value));
      return hasData;
    });

  return { parsed, missingColumns };
}

export default function BulkProductImport({ open, onClose, onCompleted, productTypes }: BulkProductImportProps) {
  const [fileName, setFileName] = useState<string>("");
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const discardedRows = useMemo(() => rows.filter((row) => row.errors.length), [rows]);
  const validRows = useMemo(() => rows.filter((row) => row.payload && !row.errors.length), [rows]);

  if (!open) return null;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    setSummary(null);
    setRows([]);
    setMissingColumns([]);
    setErrorMessage(null);
    if (!file) return;

    try {
      setParsing(true);
      setFileName(file.name);
      const matrix = await readRowsFromFile(file);
      const { parsed, missingColumns: missing } = buildParsedRows(matrix, productTypes);
      setRows(parsed);
      setMissingColumns(missing);
      if (!parsed.length) {
        setErrorMessage("No se encontraron filas con datos después de leer el archivo.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Ocurrió un error leyendo el archivo. Verificá que no esté protegido y que tenga una sola pestaña.");
    } finally {
      setParsing(false);
      input.value = "";
    }
  }

  async function handleImport() {
    if (!validRows.length) {
      setErrorMessage("No hay filas válidas para importar.");
      return;
    }

    setImporting(true);
    setErrorMessage(null);

    const results: ImportSummaryItem[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const chunk = validRows.slice(i, i + BATCH_SIZE);
      const settled = await Promise.allSettled(
        chunk.map((row) => {
          const payload = row.payload!;
          return payload.action === "update" && payload.id
            ? updateProduct(payload.id, payload.data)
            : createProduct(payload.data);
        })
      );

      settled.forEach((result, idx) => {
        const row = chunk[idx];
        const payload = row.payload!;
        if (result.status === "fulfilled") {
          results.push({
            index: row.index,
            name: payload.data.name,
            status: "fulfilled",
            action: payload.action,
          });
          if (payload.action === "create") {
            created += 1;
          } else {
            updated += 1;
          }
        } else {
          failed += 1;
          results.push({
            index: row.index,
            name: payload.data.name,
            status: "rejected",
            action: payload.action,
            message: result.reason?.message || "Error desconocido",
          });
        }
      });
    }

    const summaryPayload: ImportSummary = {
      total: rows.length,
      attempted: validRows.length,
      created,
      updated,
      failed,
      results,
    };

    setSummary(summaryPayload);
    setImporting(false);
    onCompleted?.(summaryPayload);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Importar productos masivamente</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cargá un archivo XLSX/XLS/CSV con la estructura indicada para crear o actualizar productos en lotes pequeños.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
            onClick={onClose}
            disabled={parsing || importing}
          >
            Cerrar
          </button>
        </div>

        <section className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
          <h3 className="text-sm font-semibold text-slate-700">Formato esperado</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Cabeceras obligatorias: <code className="font-mono">nombre</code>, <code className="font-mono">precio</code>, <code className="font-mono">stock</code>.
            </li>
            <li>
              Columnas opcionales: <code className="font-mono">categoria</code>, <code className="font-mono">activo</code>, <code className="font-mono">id</code> (para actualizar).
            </li>
            <li>
              El precio se interpreta en pesos argentinos. Acepta montos con coma o punto decimal y símbolos monetarios.
            </li>
            <li>
              El stock debe ser numérico. Se redondeará al entero más cercano.
            </li>
            <li>
              El campo <code className="font-mono">activo</code> admite valores "sí", "no", "true", "false", "1" o "0". Si falta, se da por activo.
            </li>
            <li>
              La categoría se asocia al listado actual de tipos de producto. Si no coincide, se guarda como categoría histórica sin <code className="font-mono">productTypeId</code>.
            </li>
          </ul>
        </section>

        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Seleccioná un archivo
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2"
              disabled={parsing || importing}
            />
          </label>
          {fileName && (
            <p className="text-xs text-slate-500">Archivo seleccionado: {fileName}</p>
          )}
          {parsing && <p className="text-sm text-slate-500">Leyendo archivo…</p>}
          {missingColumns.length > 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              Faltan columnas obligatorias: {missingColumns.join(", ")}.
            </p>
          )}
          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{errorMessage}</p>
          )}
        </div>

        {rows.length > 0 && (
          <section className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <div>
                <strong>{rows.length}</strong> filas detectadas, {validRows.length} listas para importar.
              </div>
              {discardedRows.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  {discardedRows.length} fila(s) se omitieron por errores.
                </div>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Fila</th>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Categoría</th>
                    <th className="px-3 py-2 text-right">Precio</th>
                    <th className="px-3 py-2 text-right">Stock</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row) => {
                    const payload = row.payload;
                    const observations = [...row.errors, ...row.warnings];
                    const isValid = row.errors.length === 0 && payload;
                    return (
                      <tr key={row.index} className={!isValid ? "bg-rose-50/60" : ""}>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{row.index}</td>
                        <td className="px-3 py-2">{payload?.data.name || row.normalized.name || "—"}</td>
                        <td className="px-3 py-2">{payload?.data.productTypeTitle || row.normalized.category || "General"}</td>
                        <td className="px-3 py-2 text-right">
                          {payload ? payload.data.price.toLocaleString("es-AR", { style: "currency", currency: "ARS" }) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">{payload ? payload.data.stock : "—"}</td>
                        <td className="px-3 py-2">
                          {payload ? (payload.data.active ? "Activo" : "Inactivo") : row.normalized.active === false ? "Inactivo" : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {observations.length ? (
                            <ul className="list-disc space-y-1 pl-4 text-amber-700">
                              {observations.map((note, index) => (
                                <li key={index}>{note}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-slate-400">Sin observaciones</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                onClick={() => {
                  setRows([]);
                  setSummary(null);
                  setFileName("");
                  setMissingColumns([]);
                }}
                disabled={parsing || importing}
              >
                Limpiar selección
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:-translate-y-0.5 disabled:opacity-60"
                onClick={handleImport}
                disabled={importing || parsing || !validRows.length}
              >
                {importing ? "Importando…" : `Importar ${validRows.length} fila(s)`}
              </button>
            </div>
          </section>
        )}

        {summary && (
          <section className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <p>
                Intentos: {summary.attempted} | Creados: {summary.created} | Actualizados: {summary.updated} | Errores: {summary.failed}
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Fila</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-left">Acción</th>
                    <th className="px-3 py-2 text-left">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.results.map((item, index) => (
                    <tr key={`${item.index}-${index}`}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">{item.index}</td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 capitalize">{item.action === "create" ? "Creación" : "Actualización"}</td>
                      <td className="px-3 py-2">
                        {item.status === "fulfilled" ? (
                          <span className="text-emerald-600">Completado</span>
                        ) : (
                          <span className="text-red-600">{item.message || "Error"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

