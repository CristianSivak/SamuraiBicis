import { auth } from "../firebase";

const BASE_URL = "https://us-central1-bikeshop-ab2f0.cloudfunctions.net";

export type TipoComprobante = "FCA" | "NCA" | "NDA";

export type Comprobante = {
  Id: number;
  Tipo: TipoComprobante;
  Numero: string;
  Fecha: string;
  FechaVencimiento: string | null;
  Total: number;
  Saldo: number;
  IdCliente: number;
  RazonSocial: string;
  [key: string]: unknown;
};

export type ComprobanteDetalle = Comprobante & {
  Items: Array<{
    Descripcion: string;
    Cantidad: number;
    PrecioUnitario: number;
    Total: number;
    [key: string]: unknown;
  }>;
};

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sesión no iniciada");
  return user.getIdToken();
}

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${BASE_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Error ${res.status}` }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export type GetComprobantesParams = {
  tipos?: TipoComprobante[];
  desde?: string;
  hasta?: string;
};

export async function getClientComprobantes(
  params: GetComprobantesParams = {}
): Promise<{ items: Comprobante[]; total: number }> {
  return callFunction("getClientComprobantes", params);
}

export async function getComprobanteDetail(id: number): Promise<ComprobanteDetalle> {
  return callFunction("getComprobanteDetail", { id });
}

export type DepositoStockItem = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  stockActual: number;
  stockDisponible: number;
};

export async function getMyDepositoStock(): Promise<{
  depositoId: number;
  depositoNombre: string | null;
  items: DepositoStockItem[];
}> {
  return callFunction("getMyDepositoStock", {});
}

export async function getDepositoStockAdmin(depositoId: number): Promise<{
  depositoId: number;
  items: DepositoStockItem[];
}> {
  return callFunction("getDepositoStockAdmin", { depositoId });
}
