const TOKEN_URL = "https://rest.contabilium.com/token";
const API_BASE  = "https://rest.contabilium.com/api";
const PAGE_SIZE = 100;

let _token = null;
let _tokenExpiry = 0;

async function getAccessToken(email, apiKey) {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     String(email || "").trim(),
    client_secret: String(apiKey || "").trim(),
  });
  const res = await fetch(TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Contabilium auth error ${res.status}: ${detail}`);
  }
  const { access_token } = await res.json();
  _token = access_token;
  _tokenExpiry = Date.now() + 4 * 60 * 60 * 1000;
  return _token;
}

async function getAllConceptos(email, apiKey) {
  const token = await getAccessToken(email, apiKey);
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${API_BASE}/conceptos/search?pageSize=${PAGE_SIZE}&pageIndex=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Contabilium conceptos error ${res.status}`);
    const { Items = [] } = await res.json();
    all.push(...Items);
    if (Items.length < PAGE_SIZE) break;
    page++;
  }
  return all;
}

// Trae todo el stock de un depósito puntual (paginado)
async function getStockByDeposito(email, apiKey, depositoId) {
  const token = await getAccessToken(email, apiKey);
  const all = [];
  let page = 0;
  while (true) {
    const res = await fetch(
      `${API_BASE}/inventarios/getStockByDeposito?id=${depositoId}&page=${page}&pageSize=${PAGE_SIZE}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Contabilium stock por depósito error ${res.status}`);
    const { Items = [], TotalPage = 1 } = await res.json();
    all.push(...Items);
    page++;
    if (page >= TotalPage || Items.length === 0) break;
  }
  return all;
}

// Trae un cliente de Contabilium por su Id
async function getClientById(email, apiKey, contabiliumId) {
  const token = await getAccessToken(email, apiKey);
  const res = await fetch(
    `${API_BASE}/clientes/${contabiliumId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Contabilium clientes error ${res.status}`);
  return res.json();
}

// Busca un cliente por CUIT/DNI (NroDoc)
async function searchClientByDoc(email, apiKey, nroDoc) {
  const token = await getAccessToken(email, apiKey);
  const res = await fetch(
    `${API_BASE}/clientes/search?pageSize=5&pageIndex=1&nroDoc=${encodeURIComponent(nroDoc)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Contabilium clientes search error ${res.status}`);
  const { Items = [] } = await res.json();
  return Items[0] || null;
}

// Trae todos los comprobantes de un período y filtra por cliente server-side
// (la API de Contabilium no soporta filtro por IdCliente en /search)
async function getComprobantesByClientId(email, apiKey, contabiliumId, {
  tipos = ["FCA", "NCA", "NDA"],
  desde = null,
  hasta = null,
} = {}) {
  const token = await getAccessToken(email, apiKey);

  const fechaHasta = hasta || new Date().toISOString().slice(0, 10);
  const defaultDesde = new Date();
  defaultDesde.setFullYear(defaultDesde.getFullYear() - 2);
  const fechaDesde = desde || defaultDesde.toISOString().slice(0, 10);

  const all = [];
  let page = 1;
  const MAX_PAGES = 30; // seguridad: máx 3000 comprobantes por consulta

  while (page <= MAX_PAGES) {
    const params = new URLSearchParams({
      pageSize: String(PAGE_SIZE),
      pageIndex: String(page),
      fechaDesde,
      fechaHasta,
    });

    const res = await fetch(
      `${API_BASE}/comprobantes/search?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Contabilium comprobantes error ${res.status}`);
    const payload = await res.json();
    const Items = Array.isArray(payload?.Items) ? payload.Items : (Array.isArray(payload) ? payload : []);

    const filtered = Items.filter(
      (c) => c.IdCliente === contabiliumId && tipos.includes(c.Tipo)
    );
    all.push(...filtered);

    if (Items.length < PAGE_SIZE) break;
    page++;
  }

  all.sort((a, b) => (b.Fecha || "").localeCompare(a.Fecha || ""));
  return all;
}

// Trae el detalle completo de un comprobante (líneas de ítems) para generar PDF
async function getComprobanteById(email, apiKey, id) {
  const token = await getAccessToken(email, apiKey);
  const res = await fetch(
    `${API_BASE}/comprobantes/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Contabilium comprobante ${id} error ${res.status}`);
  return res.json();
}

module.exports = { getAllConceptos, getClientById, searchClientByDoc, getComprobantesByClientId, getComprobanteById, getStockByDeposito };
