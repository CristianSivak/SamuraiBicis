import { useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),_transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-500 via-purple-500 to-slate-500" />

      <div
        className="relative z-10 grid min-h-screen"
        style={{ gridTemplateColumns: collapsed ? "88px 1fr" : "300px 1fr" }}
      >
        <aside className="sticky top-0 min-h-screen border-r border-slate-800/60 bg-slate-950/75 backdrop-blur-xl">
          <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </aside>

        <section className="flex min-h-screen flex-col">
          <AdminTopbar onToggleSidebar={() => setCollapsed(!collapsed)} collapsed={collapsed} />
          <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-[1400px] space-y-10">
              {children}
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
