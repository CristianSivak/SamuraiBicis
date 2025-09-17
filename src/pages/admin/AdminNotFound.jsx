import { Link } from "react-router-dom";
export default function AdminNotFound(){
  return (
    <div className="text-center p-10 rounded-2xl border bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Página no encontrada</h1>
      <p className="text-slate-600 mb-4">La ruta de administración no existe.</p>
      <Link to="/admin" className="inline-block px-4 py-2 rounded-lg border hover:bg-slate-50">
        Volver al Dashboard
      </Link>
    </div>
  );
}
