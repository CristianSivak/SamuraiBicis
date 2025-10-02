import { useMemo } from 'react'
import { useCustomerTypeOfUser } from '../hooks/useCustomerTypeOfUser'
import { calculateDiscountedPrice } from '../utils/pricing'

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type PriceProps = {
  base: number
  customerTypeId?: string | null
  className?: string
}

export default function Price({ base, customerTypeId, className }: PriceProps) {
  const { customerType } = useCustomerTypeOfUser(customerTypeId)

  const discount = customerType && customerType.activo ? customerType.descuentoPorcentaje : 0
  const finalPrice = useMemo(() => calculateDiscountedPrice(base, discount), [base, discount])
  const hasDiscount = discount > 0 && customerType?.activo

  return (
    <div className={className}>
      {hasDiscount ? (
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            {customerType?.nombre} · -{discount}%
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-emerald-700">{formatter.format(finalPrice)}</span>
            <span className="text-sm text-slate-400 line-through">{formatter.format(base)}</span>
          </div>
        </div>
      ) : (
        <span className="text-base font-semibold text-slate-900">{formatter.format(base)}</span>
      )}
    </div>
  )
}
