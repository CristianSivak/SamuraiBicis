import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProduct, updateProduct, type Product } from '../../../services/products'
import { useProductTypesPublic } from '../hooks/useProductTypesPublic'

const productFormSchema = z.object({
  nombre: z.string().min(2, 'Ingresá al menos 2 caracteres'),
  precioLista: z
    .number()
    .min(0.01, 'Ingresá un precio mayor a 0')
    .refine((value) => value <= 10000000, 'Precio demasiado alto'),
  stock: z
    .number()
    .min(0, 'El stock no puede ser negativo'),
  category: z.string().optional(),
  tipoProductoId: z.string().min(1, 'Seleccioná un tipo de producto'),
  activo: z.boolean(),
})

type ProductFormValues = {
  nombre: string
  precioLista: number
  stock: number
  category?: string
  tipoProductoId: string
  activo: boolean
}

type ProductFormProps = {
  open: boolean
  onClose: () => void
  initial?: Partial<Product> | null
  onSaved?: (product: Product) => void
}

export default function ProductForm({ open, onClose, initial, onSaved }: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>(initial?.imageUrl || '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { items: productTypes, loading: loadingProductTypes } = useProductTypesPublic()

  const form = useForm<ProductFormValues>({
    defaultValues: {
      nombre: initial?.name || '',
      precioLista: Number(initial?.precioLista ?? initial?.price ?? 0),
      stock: Number(initial?.stock ?? 0),
      category: initial?.category || 'general',
      tipoProductoId: initial?.tipoProductoId || '',
      activo: initial?.active ?? true,
    },
    resolver: zodResolver(productFormSchema),
  })

  useEffect(() => {
    form.reset({
      nombre: initial?.name || '',
      precioLista: Number(initial?.precioLista ?? initial?.price ?? 0),
      stock: Number(initial?.stock ?? 0),
      category: initial?.category || 'general',
      tipoProductoId: initial?.tipoProductoId || '',
      activo: initial?.active ?? true,
    })
    setImageFile(null)
    setPreview(initial?.imageUrl || '')
    setError(null)
  }, [form, initial, open])

  const options = useMemo(
    () => productTypes.map((type) => ({ value: type.id, label: type.nombre })),
    [productTypes],
  )

  useEffect(() => {
    if (!open) {
      form.reset()
      setImageFile(null)
      setPreview('')
      setError(null)
    }
  }, [form, open])

  if (!open) return null

  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      setSaving(true)
      let saved: Product
      if (initial?.id) {
        await updateProduct(initial.id, {
          name: values.nombre,
          precioLista: values.precioLista,
          stock: values.stock,
          category: values.category,
          active: values.activo,
          tipoProductoId: values.tipoProductoId,
          imageFile,
        })
        saved = {
          ...(initial as Product),
          name: values.nombre,
          precioLista: values.precioLista,
          price: values.precioLista,
          stock: values.stock,
          category: values.category || 'general',
          active: values.activo,
          tipoProductoId: values.tipoProductoId,
          imageUrl: imageFile ? preview : initial?.imageUrl || '',
        }
      } else {
        const created = await createProduct({
          name: values.nombre,
          precioLista: values.precioLista,
          stock: values.stock,
          category: values.category,
          active: values.activo,
          tipoProductoId: values.tipoProductoId,
          imageFile,
        })
        saved = created
      }
      onSaved?.(saved)
      onClose()
    } catch (err) {
      console.error(err)
      setError((err as Error).message || 'No pudimos guardar el producto')
    } finally {
      setSaving(false)
    }
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {initial?.id ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            disabled={saving}
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nombre *</label>
              <input
                type="text"
                {...form.register('nombre')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Mountain Bike 300"
                disabled={saving}
              />
              {form.formState.errors.nombre && (
                <p className="text-xs text-rose-600">{form.formState.errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Precio lista (ARS) *</label>
              <input
                type="number"
                step="0.01"
                min={0.01}
                {...form.register('precioLista')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                disabled={saving}
              />
              {form.formState.errors.precioLista && (
                <p className="text-xs text-rose-600">{form.formState.errors.precioLista.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Stock *</label>
              <input
                type="number"
                min={0}
                {...form.register('stock')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                disabled={saving}
              />
              {form.formState.errors.stock && (
                <p className="text-xs text-rose-600">{form.formState.errors.stock.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tipo de producto *</label>
              <select
                {...form.register('tipoProductoId')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                disabled={saving || loadingProductTypes}
              >
                <option value="">Seleccioná una opción</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.tipoProductoId && (
                <p className="text-xs text-rose-600">{form.formState.errors.tipoProductoId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Categoría</label>
              <input
                type="text"
                {...form.register('category')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                disabled={saving}
              />
            </div>

            <Controller
              name="activo"
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                    className="h-5 w-5 rounded border border-slate-300 text-sky-600 focus:ring-sky-200"
                    disabled={saving}
                  />
                  Activo
                </label>
              )}
            />

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-700">Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setImageFile(file)
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = () => setPreview(String(reader.result || ''))
                    reader.readAsDataURL(file)
                  } else {
                    setPreview(initial?.imageUrl || '')
                  }
                }}
                disabled={saving}
              />
              {preview && (
                <img src={preview} alt="Vista previa" className="h-32 w-32 rounded-xl border border-slate-200 object-cover" />
              )}
            </div>
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.formState.isValid}
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Guardando…' : initial?.id ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
