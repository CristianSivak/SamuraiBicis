import { saveDollarConfig, type DollarConfig } from "./dollarConfig";

const SERIES_API_URL =
  "https://apis.datos.gob.ar/series/api/series/?ids=272.3_T_CAMBIOR_D_0_0_26&limit=1&sort=desc";
const BLUELYTICS_API_URL = "https://api.bluelytics.com.ar/v2/latest";

export type OfficialUsdArsRate = {
  value: number;
  date: string;
};

async function fetchFromSeries(signal?: AbortSignal): Promise<OfficialUsdArsRate> {
  const response = await fetch(SERIES_API_URL, {
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

async function fetchFromBluelytics(
  signal?: AbortSignal
): Promise<OfficialUsdArsRate> {
  const response = await fetch(BLUELYTICS_API_URL, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo obtener el tipo de cambio de respaldo (estado ${response.status}).`
    );
  }

  const payload = await response.json();
  const official = payload?.oficial;
  const value =
    typeof official?.value_avg === "number"
      ? official.value_avg
      : official?.value_sell;
  const rate = Number(value);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("El tipo de cambio recibido del respaldo no es válido.");
  }

  const date = payload?.last_update || payload?.last_update_date || "";

  return {
    value: rate,
    date: String(date),
  };
}

export async function fetchOfficialUsdArsRate(
  signal?: AbortSignal
): Promise<OfficialUsdArsRate> {
  try {
    return await fetchFromSeries(signal);
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      throw err;
    }
    console.warn("Fallo el endpoint principal de tipo de cambio, probando respaldo", err);
  }

  return fetchFromBluelytics(signal);
}

export type EffectiveRateResult = OfficialUsdArsRate & {
  mode: "auto" | "manual" | "disabled";
  usedFallback: boolean;
};

/**
 * Obtiene la tasa efectiva según la configuración del administrador.
 * - Si mode=manual: usa el valor manual guardado.
 * - Si mode=auto: intenta la API; si falla, usa el último valor guardado en Firestore.
 * Cuando la API auto retorna OK, actualiza lastAutoValue en Firestore para futuros fallbacks.
 */
export async function fetchEffectiveRate(
  config: DollarConfig,
  signal?: AbortSignal
): Promise<EffectiveRateResult> {
  if (config.mode === "disabled") {
    return { value: 0, date: "", mode: "disabled", usedFallback: false };
  }

  if (config.mode === "manual") {
    return {
      value: config.manualValue,
      date: "manual",
      mode: "manual",
      usedFallback: false,
    };
  }

  // Auto mode
  try {
    const result = await fetchOfficialUsdArsRate(signal);
    // Persist the fresh auto value for offline/failure fallback
    saveDollarConfig({
      lastAutoValue: result.value,
      lastAutoDate: result.date,
    }).catch(() => {});
    return { ...result, mode: "auto", usedFallback: false };
  } catch (err) {
    if ((err as any)?.name === "AbortError") throw err;
    // Use last stored value as fallback
    const fallbackValue = config.lastAutoValue;
    const fallbackDate = config.lastAutoDate;
    if (fallbackValue > 0) {
      console.warn("[exchangeRates] API falló, usando último valor guardado:", fallbackValue);
      return {
        value: fallbackValue,
        date: fallbackDate,
        mode: "auto",
        usedFallback: true,
      };
    }
    throw err;
  }
}
