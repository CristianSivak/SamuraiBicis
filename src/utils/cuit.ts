// Validación y formato de CUIT/CUIL argentino (algoritmo AFIP)

export function validateCuit(raw: string): boolean {
  const clean = raw.replace(/[-\s]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = multipliers.reduce((acc, m, i) => acc + parseInt(clean[i], 10) * m, 0);
  const remainder = sum % 11;
  const check = remainder < 2 ? remainder : 11 - remainder;
  return check === parseInt(clean[10], 10);
}

export function formatCuit(raw: string): string {
  const clean = raw.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 2) return clean;
  if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean[10]}`;
}
