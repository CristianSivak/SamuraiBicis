import { useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useCustomerTypes } from '../hooks/useCustomerTypes'

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const handler = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(handler)
  }, [value, delay])
  return debounced
}

export default function CustomerTypesList() {
  const history = useHistory()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { items, loading, error, toggle, remove, refetch } = useCustomerTypes(debouncedSearch)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    if (feedback) {
      const timeout = window.setTimeout(() => setFeedback(null), 2500)
      return () => window.clearTimeout(timeout)
    }
    return undefined
  }, [feedback])

  const rows = useMemo(() => items, [items])

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggle(id, !active)
      setFeedbackType('success')
      setFeedback('Estado actualizado correctamente')
    } catch (err) {
      console.error(err)
      setFeedbackType('error')
      setFeedback('No se pudo actualizar el estado')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que querés eliminar este tipo de cliente?')) {
      return
    }
    try {
      await remove(id)
      setFeedbackType('success')
      setFeedback('Tipo de cliente eliminado')
    } catch (err) {
      console.error(err)
      setFeedbackType('error')
      setFeedback('No se pudo eliminar el registro')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tipos de clientes</h1>
          <p className="text-sm text-slate-500">Administrá descuentos y clasificaciones de clientes.</p>
        </div>
        <button
          onClick={() => history.push('/admin/tipos-clientes/nuevo')}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          Nuevo tipo
        </button>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-64">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <button
            onClick={refetch}
            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 px-4 text-sm text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
          >
            Refrescar
          </button>
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              feedbackType === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : feedbackType === 'error'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {feedback}
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Descuento</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Cargando tipos de clientes...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-rose-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    No encontramos resultados.
                  </td>
                </tr>
              )}
              {!loading && !error &&
                rows.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.nombre}</div>
                      {item.descripcion && <div className="text-xs text-slate-500">{item.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.descuentoPorcentaje}%</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => history.push(`/admin/tipos-clientes/${item.id}`)}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggle(item.id, item.activo)}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
                        >
                          {item.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
