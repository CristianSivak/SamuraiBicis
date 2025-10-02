import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useHistory, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { productTypeFormSchema, type ProductTypeFormValues } from '../schema/productType.schema'
import {
  createProductType,
  getProductTypeById,
  updateProductType,
} from '../services/productTypes.api'

interface RouteParams {
  id?: string
}

export default function ProductTypeForm() {
  const history = useHistory()
  const params = useParams<RouteParams>()
  const isEditing = Boolean(params.id && params.id !== 'nuevo')
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const form = useForm<ProductTypeFormValues>({
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true,
    },
    resolver: zodResolver(productTypeFormSchema),
  })

  useEffect(() => {
    let active = true
    async function load() {
      if (!isEditing || !params.id) return
      try {
        setLoading(true)
        const data = await getProductTypeById(params.id)
        if (!data) {
          setError('No encontramos este registro')
          return
        }
        if (active) {
          form.reset({
            nombre: data.nombre,
            descripcion: data.descripcion || '',
            activo: data.activo,
          })
          setError(null)
        }
      } catch (err) {
        console.error(err)
        setError('Ocurrió un error al cargar los datos')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [form, isEditing, params.id])

  useEffect(() => {
    if (feedback) {
      const timeout = window.setTimeout(() => setFeedback(null), 2500)
      return () => window.clearTimeout(timeout)
    }
    return undefined
  }, [feedback])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setSaving(true)
      if (isEditing && params.id) {
        await updateProductType(params.id, values)
        setFeedback('Tipo de producto actualizado')
      } else {
        await createProductType(values)
        setFeedback('Tipo de producto creado')
        form.reset({ nombre: '', descripcion: '', activo: true })
      }
      setError(null)
    } catch (err) {
      console.error(err)
      setError('No pudimos guardar los cambios')
    } finally {
      setSaving(false)
    }
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {isEditing ? 'Editar tipo de producto' : 'Nuevo tipo de producto'}
        </h1>
        <p className="text-sm text-slate-500">Ayudá a los equipos a catalogar correctamente cada producto.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading && <p className="text-sm text-slate-500">Cargando datos...</p>}
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
        {feedback && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nombre *</label>
            <input
              type="text"
              {...form.register('nombre')}
              placeholder="Bicicletas"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            {form.formState.errors.nombre && (
              <p className="text-xs text-rose-600">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Descripción</label>
            <textarea
              rows={3}
              {...form.register('descripcion')}
              placeholder="Productos orientados a movilidad urbana"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            {form.formState.errors.descripcion && (
              <p className="text-xs text-rose-600">{form.formState.errors.descripcion.message}</p>
            )}
          </div>
        </div>

        <Controller
          name="activo"
          control={form.control}
          render={({ field }) => (
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                className="h-5 w-5 rounded border border-slate-300 text-sky-600 focus:ring-sky-200"
              />
              Activo
            </label>
          )}
        />

        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => history.push('/admin/tipos-producto')}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !form.formState.isValid}
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
