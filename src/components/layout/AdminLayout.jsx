import { useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <div className="grid" style={{ gridTemplateColumns: collapsed ? "80px 1fr" : "280px 1fr" }}>
        {/* Sidebar */}
        <aside className="border-r bg-white/70 backdrop-blur sticky top-0 h-screen">
          <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </aside>

        {/* Content */}
        <section className="min-h-screen">
          <AdminTopbar />
          <main className="p-6 lg:p-8">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}
