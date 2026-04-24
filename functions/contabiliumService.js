const TOKEN_URL = "https://rest.contabilium.com/token";
const API_BASE  = "https://rest.contabilium.com/api";
const PAGE_SIZE = 100;

let _token = null;
let _tokenExpiry = 0;

async function getAccessToken(email, apiKey) {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     email,
    client_secret: apiKey,
  });
  const res = await fetch(TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });
  if (!res.ok) throw new Error(`Contabilium auth error ${res.status}`);
  const { access_token } = await res.json();
  _token = access_token;
  _tokenExpiry = Date.now() + 4 * 60 * 60 * 1000; // 4h (token válido ~5h)
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

module.exports = { getAllConceptos };
