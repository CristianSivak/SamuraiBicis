/**
 * Calcula el precio final aplicando el descuento indicado.
 * @param {number} base Precio de lista original.
 * @param {number} discountPercentage Porcentaje de descuento a aplicar (0-100).
 * @returns {number} Precio final con dos decimales.
 */
export function calculateDiscountedPrice(base, discountPercentage) {
  const normalizedBase = Number(base || 0);
  const normalizedDiscount = Number.isFinite(discountPercentage) ? discountPercentage : 0;
  const final = normalizedBase * (1 - normalizedDiscount / 100);
  return Math.round(final * 100) / 100;
}
