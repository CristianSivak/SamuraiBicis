const API_URL =
  "https://apis.datos.gob.ar/series/api/series/?ids=272.3_T_CAMBIOR_D_0_0_26&limit=1&sort=desc";

export type OfficialUsdArsRate = {
  value: number;
  date: string;
};

export async function fetchOfficialUsdArsRate(
  signal?: AbortSignal
): Promise<OfficialUsdArsRate> {
  const response = await fetch(API_URL, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo obtener el tipo de cambio oficial (estado ${response.status}).`
    );
  }

  const payload = await response.json();
  const series = payload?.series?.[0];
  const dataPoint = Array.isArray(series?.data?.[0]) ? series.data[0] : null;

  if (!dataPoint) {
    throw new Error("La respuesta del servicio oficial no tiene datos.");
  }

  const [, value] = dataPoint;
  const rate = Number(value);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("El tipo de cambio recibido no es válido.");
  }

  return {
    value: rate,
    date: String(dataPoint[0] ?? ""),
  };
}
